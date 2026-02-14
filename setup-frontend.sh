#!/bin/bash

# 🚀 Rizq.AI Frontend Auto-Setup Script
# This script will create and configure your entire frontend automatically!

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     🚀 Rizq.AI Frontend Auto-Setup - Sit Back & Relax! 😊      ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Navigate to projects directory
echo "📁 Step 1/8: Navigating to projects directory..."
cd /home/arbaz/projects/rizq-ai

# Step 2: Create Next.js app
echo "🎨 Step 2/8: Creating Next.js app (this may take 2-3 minutes)..."
if [ -d "rizq-ai-frontend" ]; then
  echo "⚠️  Frontend directory already exists! Skipping creation..."
else
  npx create-next-app@latest rizq-ai-frontend \
    --typescript \
    --eslint \
    --tailwind \
    --src-dir \
    --app \
    --no-turbopack \
    --import-alias "@/*" \
    --yes
fi

cd rizq-ai-frontend

# Step 3: Install shadcn/ui
echo "🎭 Step 3/8: Setting up shadcn/ui..."
npx shadcn@latest init \
  --defaults \
  --yes

# Step 4: Install dependencies
echo "📦 Step 4/8: Installing dependencies..."
npm install axios zustand @tanstack/react-query date-fns lucide-react --legacy-peer-deps

# Step 5: Install shadcn components
echo "🧩 Step 5/8: Adding UI components..."
npx shadcn@latest add button card input badge dialog dropdown-menu select skeleton --yes --overwrite

# Step 6: Create environment file
echo "⚙️  Step 6/8: Creating environment configuration..."
cat > .env.local << 'EOF'
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Rizq.AI
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Step 7: Create API client
echo "🔌 Step 7/8: Creating API client..."
mkdir -p src/lib

cat > src/lib/api.ts << 'EOF'
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Job Search
export const searchJobs = async (params: {
  query: string;
  location?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'salary' | 'match';
}) => {
  const response = await api.get('/workflow/search', { params });
  return response.data;
};

// Get Recommendations
export const getRecommendations = async () => {
  const response = await api.get('/workflow/recommended');
  return response.data;
};

// Apply to Jobs
export const applyToJobs = async (jobIds: string[]) => {
  const response = await api.post('/workflow/apply', { jobIds });
  return response.data;
};

// Authentication
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string, name: string) => {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
EOF

# Step 8: Create main page
echo "🏠 Step 8/8: Creating job search page..."
cat > src/app/page.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { searchJobs } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building2, Briefcase, Loader2 } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  url: string;
}

export default function HomePage() {
  const [query, setQuery] = useState('software engineer');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchJobs({ query, location, limit: 10 });
      if (result.success) {
        setJobs(result.data.jobs);
        setTotal(result.data.total);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.message || 'Failed to search jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rizq.AI
          </h1>
          <p className="text-slate-600 mt-1">Find your dream job with AI-powered search</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Search Jobs</CardTitle>
            <CardDescription className="text-base">
              {total > 0 ? `${total} jobs available in our database` : 'Start searching for your next opportunity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Job title, keywords, or company..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Location (optional)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="h-12 px-8 text-base">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Job Results */}
        {!loading && jobs.length > 0 && (
          <div className="mt-8 space-y-4">
            {jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-xl transition-all duration-200 hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                      </CardDescription>
                    </div>
                    {job.salaryMin && job.salaryMax && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        ₹{(job.salaryMin / 100000).toFixed(1)}-
                        {(job.salaryMax / 100000).toFixed(1)} LPA
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-3 text-base">
                    {job.description || 'No description available'}
                  </p>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.slice(0, 8).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                      {job.requirements.length > 8 && (
                        <Badge variant="outline" className="text-sm">
                          +{job.requirements.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1 sm:flex-initial">
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        View Job Details
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-initial">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Quick Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && !error && (
          <div className="mt-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No jobs found</h3>
                <p className="text-slate-500 text-center">
                  Try adjusting your search terms or removing the location filter
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>Built with ❤️ by Rizq.AI Team</p>
          <p className="text-sm mt-2">Powered by AI •</p>
        </div>
      </footer>
    </div>
  );
}
EOF

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ SETUP COMPLETE! 🎉                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Frontend location: /home/arbaz/projects/rizq-ai/rizq-ai-frontend"
echo ""
echo "🚀 TO START YOUR FRONTEND:"
echo ""
echo "   cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend"
echo "   npm run dev"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
echo "💡 Make sure your backend is running on http://localhost:8080"
echo ""
echo "🎊 You're all set! Your frontend is ready to go!"
echo ""


