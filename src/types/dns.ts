
export interface DNSRecord {
  name: string;
  type: string;
  data: string;
  ttl?: number;
}

export interface NameserverCheck {
  nameserver: string;
  status: 'pass' | 'fail' | 'warning';
  responseTime?: number;
  error?: string;
}

export interface SOARecord {
  primaryNS: string;
  adminEmail: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimumTTL: number;
}

export interface MXRecord {
  exchange: string;
  priority: number;
}

export interface DNSCheck {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  score: number;
  recommendations?: string[];
}

export interface DNSReport {
  domain: string;
  timestamp: string;
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  checks: {
    nameservers: DNSCheck & { nameservers: NameserverCheck[] };
    soa: DNSCheck & { record?: SOARecord };
    mx: DNSCheck & { records: MXRecord[] };
    a: DNSCheck & { records: DNSRecord[] };
    aaaa: DNSCheck & { records: DNSRecord[] };
    cname: DNSCheck & { records: DNSRecord[] };
    ptr: DNSCheck & { records: DNSRecord[] };
    propagation: DNSCheck;
    security: DNSCheck;
  };
}
