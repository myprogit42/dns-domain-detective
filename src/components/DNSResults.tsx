
import { CheckCircle, XCircle, AlertCircle, ChevronDown, Clock, Server, Mail, Globe, Shield, Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DNSReport } from "@/types/dns";

interface DNSResultsProps {
  results: DNSReport;
}

export const DNSResults = ({ results }: DNSResultsProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-800">
                DNS Report for {results.domain}
              </CardTitle>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                {formatTime(results.timestamp)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-2 text-gray-800">
                {results.overallScore}/100
              </div>
              <Badge className={`${getStatusColor(results.overallStatus)} font-semibold`}>
                {results.overallStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Progress value={results.overallScore} className="h-3 mt-4" />
        </CardHeader>
      </Card>

      {/* DNS Checks */}
      <div className="space-y-4">
        {/* Nameservers */}
        <Collapsible>
          <Card className="shadow-md">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Nameservers</h3>
                      <p className="text-sm text-gray-600">{results.checks.nameservers.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{results.checks.nameservers.score}/100</div>
                      {getStatusIcon(results.checks.nameservers.status)}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {results.checks.nameservers.nameservers.map((ns, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(ns.status)}
                        <span className="font-mono text-sm">{ns.nameserver}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {ns.responseTime ? `${ns.responseTime}ms` : ns.error}
                      </div>
                    </div>
                  ))}
                  {results.checks.nameservers.recommendations?.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* SOA Record */}
        <Collapsible>
          <Card className="shadow-md">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">SOA Record</h3>
                      <p className="text-sm text-gray-600">{results.checks.soa.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{results.checks.soa.score}/100</div>
                      {getStatusIcon(results.checks.soa.status)}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {results.checks.soa.record && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Primary NS:</strong> {results.checks.soa.record.primaryNS}</div>
                      <div><strong>Admin Email:</strong> {results.checks.soa.record.adminEmail}</div>
                      <div><strong>Serial:</strong> {results.checks.soa.record.serial}</div>
                      <div><strong>Refresh:</strong> {results.checks.soa.record.refresh}s</div>
                      <div><strong>Retry:</strong> {results.checks.soa.record.retry}s</div>
                      <div><strong>Expire:</strong> {results.checks.soa.record.expire}s</div>
                    </div>
                  </div>
                )}
                {results.checks.soa.recommendations?.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded mt-3">
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* MX Records */}
        <Collapsible>
          <Card className="shadow-md">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">MX Records</h3>
                      <p className="text-sm text-gray-600">{results.checks.mx.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{results.checks.mx.score}/100</div>
                      {getStatusIcon(results.checks.mx.status)}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {results.checks.mx.records.map((mx, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold">{mx.exchange}</span>
                        <Badge variant="outline">Priority: {mx.priority}</Badge>
                      </div>
                      {mx.ipAddresses && mx.ipAddresses.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <strong>IP Addresses:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {mx.ipAddresses.map((ip, ipIndex) => (
                              <Badge key={ipIndex} variant="secondary" className="font-mono text-xs">
                                {ip}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {results.checks.mx.recommendations?.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* A Records */}
        <Collapsible>
          <Card className="shadow-md">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">A Records (IPv4)</h3>
                      <p className="text-sm text-gray-600">{results.checks.a.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{results.checks.a.score}/100</div>
                      {getStatusIcon(results.checks.a.status)}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {results.checks.a.records.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">{record.data}</span>
                      <span className="text-xs text-gray-500">TTL: {record.ttl}s</span>
                    </div>
                  ))}
                  {results.checks.a.recommendations?.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Additional checks in simplified format */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* AAAA Records */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">AAAA Records (IPv6)</h3>
                    <p className="text-sm text-gray-600">{results.checks.aaaa.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{results.checks.aaaa.score}/100</div>
                  {getStatusIcon(results.checks.aaaa.status)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* PTR Records */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">PTR Records</h3>
                    <p className="text-sm text-gray-600">{results.checks.ptr.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{results.checks.ptr.score}/100</div>
                  {getStatusIcon(results.checks.ptr.status)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Propagation */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">DNS Propagation</h3>
                    <p className="text-sm text-gray-600">{results.checks.propagation.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{results.checks.propagation.score}/100</div>
                  {getStatusIcon(results.checks.propagation.status)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Security */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Security</h3>
                    <p className="text-sm text-gray-600">{results.checks.security.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{results.checks.security.score}/100</div>
                  {getStatusIcon(results.checks.security.status)}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};
