import { useState } from "react";
import { Server, Clipboard, Check, HelpCircle, HardDrive, Cpu, ShieldCheck } from "lucide-react";

export default function DeploymentTab() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (section: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const dockerfileBackend = `# Multi-stage Build for Express Backend
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runner Stage
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]`;

  const nginxConfig = `# Reverse Proxy Configuration (Nginx Router)
server {
    listen 80;
    server_name cashbridge-sandbox.com;

    # Static UI Route hosting PWA files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, public, must-revalidate";
    }

    # API Proxy Routing to Express core containers
    location /api/ {
        proxy_pass http://cashbridge-backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Deployment & Containerization Spec</h2>
            <p className="text-xs text-slate-500">Multi-stage Docker configurations and secure load balancing proxies</p>
          </div>
          <span className="px-2.5 py-1 text-xs bg-slate-900 text-white rounded font-bold font-mono">GCP Cloud Run Spec</span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Details sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-705 flex items-center">
                <HardDrive className="h-4.5 w-4.5 text-blue-500 mr-2" />
                Infrastructure Standards
              </h3>
              
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div>
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">GCP Run Server</span>
                  <p className="mt-1">Deploy the Backend Node express container as state-less service on GCP Cloud Run. Autoscale down to 0 units on idle periods to save resource footprint.</p>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">PWA Site Delivery</span>
                  <p className="mt-1">Bundle React files static on CDN. Serves immediately through closest regional cells matching low-ping requirements for mobile telecom users in West-Africa.</p>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">HTTPS Encryption</span>
                  <p className="mt-1">Enforce strict SSL routing layers. Drop standard unencrypted connection prompts immediately to align with financial audit criteria.</p>
                </div>
              </div>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center">
                <ShieldCheck className="h-4.5 w-4.5 mr-1.5 text-emerald-600" />
                Production Security Rule
              </h4>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                <strong>Secret Vault Locks:</strong> API keys for Supabase backend and MTN Sandbox payloads must never reside in source control configs. Map these parameters securely via Environment secrets during target container spin epochs.
              </p>
            </div>
          </div>

          {/* Docker / Nginx Codes */}
          <div className="lg:col-span-8 space-y-6">
            {/* Backend Dockerfile */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center">
                  <Cpu className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  Express Server Web Dockerfile (Multi-Stage)
                </span>
                <button
                  onClick={() => copyToClipboard("docker", dockerfileBackend)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] text-slate-300 flex items-center space-x-1 border border-slate-750 transition-colors"
                >
                  {copiedSection === "docker" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-3 w-3" />
                      <span>Copy Spec</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-[10.5px] font-mono leading-relaxed overflow-x-auto max-h-[220px]">
                {dockerfileBackend}
              </pre>
            </div>

            {/* Nginx Proxy Config */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center">
                  <Server className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  Nginx HTTP Routing Configuration (Reverse Proxy)
                </span>
                <button
                  onClick={() => copyToClipboard("nginx", nginxConfig)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] text-slate-300 flex items-center space-x-1 border border-slate-750 transition-colors"
                >
                  {copiedSection === "nginx" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-3 w-3" />
                      <span>Copy Spec</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-[10.5px] font-mono leading-relaxed overflow-x-auto max-h-[220px]">
                {nginxConfig}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
