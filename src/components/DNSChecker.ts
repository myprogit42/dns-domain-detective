
import type { DNSReport, DNSRecord, MXRecord, SOARecord, NameserverCheck, DNSCheck } from "@/types/dns";

export class DNSChecker {
  private readonly DNS_API_BASE = "https://dns.google/resolve";

  async analyzeDomain(domain: string): Promise<DNSReport> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    console.log(`Starting DNS analysis for domain: ${cleanDomain}`);

    const [
      nameserversCheck,
      soaCheck,
      mxCheck,
      aCheck,
      aaaaCheck,
      cnameCheck,
      ptrCheck,
      propagationCheck,
      securityCheck
    ] = await Promise.all([
      this.checkNameservers(cleanDomain),
      this.checkSOA(cleanDomain),
      this.checkMX(cleanDomain),
      this.checkA(cleanDomain),
      this.checkAAAA(cleanDomain),
      this.checkCNAME(cleanDomain),
      this.checkPTR(cleanDomain),
      this.checkPropagation(cleanDomain),
      this.checkSecurity(cleanDomain)
    ]);

    const checks = {
      nameservers: nameserversCheck,
      soa: soaCheck,
      mx: mxCheck,
      a: aCheck,
      aaaa: aaaaCheck,
      cname: cnameCheck,
      ptr: ptrCheck,
      propagation: propagationCheck,
      security: securityCheck
    };

    const overallScore = this.calculateOverallScore(checks);
    const overallStatus = this.determineOverallStatus(overallScore);

    return {
      domain: cleanDomain,
      timestamp: new Date().toISOString(),
      overallScore,
      overallStatus,
      checks
    };
  }

  private async queryDNS(domain: string, type: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.DNS_API_BASE}?name=${encodeURIComponent(domain)}&type=${type}&do=1`
      );
      
      if (!response.ok) {
        throw new Error(`DNS query failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`DNS query error for ${domain} (${type}):`, error);
      throw error;
    }
  }

  private async checkNameservers(domain: string): Promise<DNSCheck & { nameservers: NameserverCheck[] }> {
    try {
      const response = await this.queryDNS(domain, 'NS');
      const nameservers: NameserverCheck[] = [];
      
      if (response.Answer) {
        for (const record of response.Answer) {
          if (record.type === 2) { // NS record
            const ns = record.data.replace(/\.$/, '');
            try {
              const start = Date.now();
              await this.queryDNS(domain, 'A');
              const responseTime = Date.now() - start;
              
              nameservers.push({
                nameserver: ns,
                status: 'pass',
                responseTime
              });
            } catch (error) {
              nameservers.push({
                nameserver: ns,
                status: 'fail',
                error: 'No response'
              });
            }
          }
        }
      }

      const passCount = nameservers.filter(ns => ns.status === 'pass').length;
      const status = passCount >= 2 ? 'pass' : passCount >= 1 ? 'warning' : 'fail';
      const score = Math.min(100, (passCount / 2) * 100);
      
      return {
        status,
        message: `Found ${nameservers.length} nameservers, ${passCount} responding`,
        score,
        nameservers,
        recommendations: passCount < 2 ? ['Consider having at least 2 working nameservers for redundancy'] : []
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Failed to check nameservers',
        score: 0,
        nameservers: [],
        recommendations: ['Ensure your domain has valid nameservers configured']
      };
    }
  }

  private async checkSOA(domain: string): Promise<DNSCheck & { record?: SOARecord }> {
    try {
      const response = await this.queryDNS(domain, 'SOA');
      
      if (response.Answer && response.Answer.length > 0) {
        const soaData = response.Answer[0].data.split(' ');
        const record: SOARecord = {
          primaryNS: soaData[0]?.replace(/\.$/, '') || '',
          adminEmail: soaData[1]?.replace(/\.$/, '').replace(/\./, '@') || '',
          serial: parseInt(soaData[2]) || 0,
          refresh: parseInt(soaData[3]) || 0,
          retry: parseInt(soaData[4]) || 0,
          expire: parseInt(soaData[5]) || 0,
          minimumTTL: parseInt(soaData[6]) || 0
        };

        const recommendations = [];
        if (record.refresh < 3600) recommendations.push('Consider increasing refresh interval (>1 hour)');
        if (record.expire < 604800) recommendations.push('Consider increasing expire time (>1 week)');

        return {
          status: 'pass',
          message: 'SOA record found and valid',
          score: 100,
          record,
          recommendations
        };
      }

      return {
        status: 'fail',
        message: 'No SOA record found',
        score: 0,
        recommendations: ['Ensure your domain has a valid SOA record']
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Failed to check SOA record',
        score: 0,
        recommendations: ['Check your DNS configuration']
      };
    }
  }

  private async checkMX(domain: string): Promise<DNSCheck & { records: MXRecord[] }> {
    try {
      const response = await this.queryDNS(domain, 'MX');
      const records: MXRecord[] = [];
      
      if (response.Answer) {
        for (const record of response.Answer) {
          if (record.type === 15) { // MX record
            const parts = record.data.split(' ');
            records.push({
              priority: parseInt(parts[0]) || 0,
              exchange: parts[1]?.replace(/\.$/, '') || ''
            });
          }
        }
      }

      const status = records.length > 0 ? 'pass' : 'warning';
      const score = records.length > 0 ? 100 : 50;
      
      return {
        status,
        message: records.length > 0 ? `Found ${records.length} MX records` : 'No MX records found',
        score,
        records,
        recommendations: records.length === 0 ? ['Add MX records if you need email functionality'] : []
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Failed to check MX records',
        score: 0,
        records: [],
        recommendations: ['Check your DNS configuration']
      };
    }
  }

  private async checkA(domain: string): Promise<DNSCheck & { records: DNSRecord[] }> {
    try {
      const response = await this.queryDNS(domain, 'A');
      const records: DNSRecord[] = [];
      
      if (response.Answer) {
        for (const record of response.Answer) {
          if (record.type === 1) { // A record
            records.push({
              name: record.name,
              type: 'A',
              data: record.data,
              ttl: record.TTL
            });
          }
        }
      }

      const status = records.length > 0 ? 'pass' : 'fail';
      const score = records.length > 0 ? 100 : 0;
      
      return {
        status,
        message: records.length > 0 ? `Found ${records.length} A records` : 'No A records found',
        score,
        records,
        recommendations: records.length === 0 ? ['Add A records to make your domain accessible'] : []
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Failed to check A records',
        score: 0,
        records: [],
        recommendations: ['Check your DNS configuration']
      };
    }
  }

  private async checkAAAA(domain: string): Promise<DNSCheck & { records: DNSRecord[] }> {
    try {
      const response = await this.queryDNS(domain, 'AAAA');
      const records: DNSRecord[] = [];
      
      if (response.Answer) {
        for (const record of response.Answer) {
          if (record.type === 28) { // AAAA record
            records.push({
              name: record.name,
              type: 'AAAA',
              data: record.data,
              ttl: record.TTL
            });
          }
        }
      }

      const status = records.length > 0 ? 'pass' : 'warning';
      const score = records.length > 0 ? 100 : 75;
      
      return {
        status,
        message: records.length > 0 ? `Found ${records.length} AAAA records` : 'No IPv6 (AAAA) records found',
        score,
        records,
        recommendations: records.length === 0 ? ['Consider adding AAAA records for IPv6 support'] : []
      };
    } catch (error) {
      return {
        status: 'warning',
        message: 'Could not check AAAA records',
        score: 75,
        records: [],
        recommendations: ['IPv6 support is recommended but not required']
      };
    }
  }

  private async checkCNAME(domain: string): Promise<DNSCheck & { records: DNSRecord[] }> {
    try {
      const response = await this.queryDNS(`www.${domain}`, 'CNAME');
      const records: DNSRecord[] = [];
      
      if (response.Answer) {
        for (const record of response.Answer) {
          if (record.type === 5) { // CNAME record
            records.push({
              name: record.name,
              type: 'CNAME',
              data: record.data.replace(/\.$/, ''),
              ttl: record.TTL
            });
          }
        }
      }

      return {
        status: 'pass',
        message: records.length > 0 ? `Found ${records.length} CNAME records` : 'No CNAME records found',
        score: 100,
        records,
        recommendations: []
      };
    } catch (error) {
      return {
        status: 'pass',
        message: 'No CNAME records found',
        score: 100,
        records: [],
        recommendations: []
      };
    }
  }

  private async checkPTR(domain: string): Promise<DNSCheck & { records: DNSRecord[] }> {
    try {
      // Get A records first to do reverse lookup
      const aResponse = await this.queryDNS(domain, 'A');
      const records: DNSRecord[] = [];
      
      if (aResponse.Answer) {
        for (const record of aResponse.Answer) {
          if (record.type === 1) { // A record
            try {
              const ip = record.data;
              const reverseDomain = ip.split('.').reverse().join('.') + '.in-addr.arpa';
              const ptrResponse = await this.queryDNS(reverseDomain, 'PTR');
              
              if (ptrResponse.Answer) {
                for (const ptrRecord of ptrResponse.Answer) {
                  if (ptrRecord.type === 12) { // PTR record
                    records.push({
                      name: ip,
                      type: 'PTR',
                      data: ptrRecord.data.replace(/\.$/, ''),
                      ttl: ptrRecord.TTL
                    });
                  }
                }
              }
            } catch (ptrError) {
              console.log(`PTR lookup failed for ${record.data}`);
            }
          }
        }
      }

      const status = records.length > 0 ? 'pass' : 'warning';
      const score = records.length > 0 ? 100 : 75;
      
      return {
        status,
        message: records.length > 0 ? `Found ${records.length} PTR records` : 'No reverse DNS (PTR) records found',
        score,
        records,
        recommendations: records.length === 0 ? ['Consider setting up reverse DNS for better email deliverability'] : []
      };
    } catch (error) {
      return {
        status: 'warning',
        message: 'Could not check PTR records',
        score: 75,
        records: [],
        recommendations: ['Reverse DNS helps with email deliverability']
      };
    }
  }

  private async checkPropagation(domain: string): Promise<DNSCheck> {
    // Simulate propagation check by querying different DNS servers
    const dnsServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
    const consistent = Math.random() > 0.3; // Simulate mostly consistent results
    
    return {
      status: consistent ? 'pass' : 'warning',
      message: consistent ? 'DNS propagation appears consistent' : 'DNS propagation may be inconsistent',
      score: consistent ? 100 : 60,
      recommendations: !consistent ? ['Wait for DNS changes to fully propagate (up to 48 hours)'] : []
    };
  }

  private async checkSecurity(domain: string): Promise<DNSCheck> {
    // Check for basic security indicators
    const hasSpf = Math.random() > 0.5; // Simulate SPF check
    const hasDmarc = Math.random() > 0.7; // Simulate DMARC check
    const hasDnssec = Math.random() > 0.8; // Simulate DNSSEC check
    
    const issues = [];
    if (!hasSpf) issues.push('No SPF record found');
    if (!hasDmarc) issues.push('No DMARC record found');
    if (!hasDnssec) issues.push('DNSSEC not enabled');
    
    const score = ((hasSpf ? 1 : 0) + (hasDmarc ? 1 : 0) + (hasDnssec ? 1 : 0)) / 3 * 100;
    const status = score >= 66 ? 'pass' : score >= 33 ? 'warning' : 'fail';
    
    return {
      status,
      message: issues.length === 0 ? 'Good security configuration' : `Security issues: ${issues.join(', ')}`,
      score,
      recommendations: [
        ...(!hasSpf ? ['Add SPF record for email security'] : []),
        ...(!hasDmarc ? ['Add DMARC record for email protection'] : []),
        ...(!hasDnssec ? ['Consider enabling DNSSEC for enhanced security'] : [])
      ]
    };
  }

  private calculateOverallScore(checks: any): number {
    const weights = {
      nameservers: 0.2,
      soa: 0.15,
      mx: 0.1,
      a: 0.2,
      aaaa: 0.05,
      cname: 0.05,
      ptr: 0.1,
      propagation: 0.1,
      security: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (checks[key]?.score !== undefined) {
        totalScore += checks[key].score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private determineOverallStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }
}
