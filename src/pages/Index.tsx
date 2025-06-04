
import { useState } from "react";
import { Search, Globe, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DNSChecker } from "@/components/DNSChecker";
import { DNSResults } from "@/components/DNSResults";
import type { DNSReport } from "@/types/dns";

const Index = () => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DNSReport | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const checker = new DNSChecker();
      const report = await checker.analyzeDomain(domain.trim());
      setResults(report);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              DNS<span className="text-blue-600">Checker</span>
            </h1>
          </div>
          <p className="text-gray-600">
            Comprehensive DNS analysis and domain health reporting
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">
              Analyze Your Domain
            </CardTitle>
            <p className="text-gray-600">
              Enter a domain name to get a comprehensive DNS health report
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 max-w-2xl mx-auto">
              <Input
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg"
                disabled={loading}
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-8 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Analyze
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && <DNSResults results={results} />}

        {/* Sample Analysis */}
        {!results && !loading && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                What We Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: CheckCircle, title: "Nameservers", desc: "Availability and response times" },
                  { icon: CheckCircle, title: "SOA Records", desc: "Start of Authority configuration" },
                  { icon: CheckCircle, title: "MX Records", desc: "Mail server setup and priorities" },
                  { icon: CheckCircle, title: "A/AAAA Records", desc: "IPv4 and IPv6 address resolution" },
                  { icon: CheckCircle, title: "CNAME Records", desc: "Canonical name mappings" },
                  { icon: CheckCircle, title: "PTR Records", desc: "Reverse DNS lookups" },
                ].map((check, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                    <check.icon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{check.title}</h3>
                      <p className="text-sm text-gray-600">{check.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
