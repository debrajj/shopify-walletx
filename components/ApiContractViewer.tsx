import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Code } from 'lucide-react';

export interface EndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: object;
  responseBody?: object;
}

export interface PageContract {
  pageName: string;
  endpoints: EndpointSpec[];
}

const MethodBadge = ({ method }: { method: string }) => {
  const colors = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-emerald-100 text-emerald-700',
    PUT: 'bg-orange-100 text-orange-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${colors[method as keyof typeof colors] || 'bg-gray-100'}`}>
      {method}
    </span>
  );
};

const EndpointItem = ({ spec }: { spec: EndpointSpec }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />}
          <MethodBadge method={spec.method} />
          <code className="text-sm font-mono text-slate-700 truncate">{spec.path}</code>
        </div>
        <span className="text-xs text-slate-500 ml-2 hidden sm:block">{spec.description}</span>
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm space-y-4 animate-fade-in">
          <p className="text-slate-600 italic sm:hidden">{spec.description}</p>
          
          {spec.requestBody && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Body</span>
              </div>
              <div className="relative group">
                <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800">
                  {JSON.stringify(spec.requestBody, null, 2)}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(spec.requestBody, null, 2))}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy JSON"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {spec.responseBody && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Response</span>
              </div>
              <div className="relative group">
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800">
                  {JSON.stringify(spec.responseBody, null, 2)}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(spec.responseBody, null, 2))}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy JSON"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ApiContractViewer = ({ contracts }: { contracts: PageContract[] }) => {
  return (
    <div className="space-y-6">
      {contracts.map((page, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            {page.pageName} Page
          </h3>
          <div className="pl-3 border-l-2 border-slate-100 ml-0.5 space-y-2">
            {page.endpoints.map((ep, i) => (
              <EndpointItem key={i} spec={ep} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};