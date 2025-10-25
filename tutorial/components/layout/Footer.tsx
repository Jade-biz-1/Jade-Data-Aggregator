'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Heart, BookOpen, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    tutorial: [
      { href: '/', label: 'Home' },
      { href: '/modules', label: 'All Modules' },
      { href: '/progress-demo', label: 'Track Progress' },
    ],
    resources: [
      { href: '/api-demo', label: 'API Demo' },
      { href: '/test-components', label: 'UI Components' },
      { href: '/sample-data', label: 'Sample Data' },
    ],
    platform: [
      { href: 'http://localhost:8001/docs', label: 'API Documentation', external: true },
      { href: 'http://localhost:3000', label: 'Main Platform', external: true },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white">Data Aggregator</div>
                <div className="text-xs text-gray-400">Tutorial</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Master data integration through hands-on learning and real-world scenarios.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <Heart className="w-3 h-3 fill-red-500 text-red-500" />
              <span>for learning</span>
            </div>
          </div>

          {/* Tutorial Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Tutorial</h3>
            <ul className="space-y-2">
              {footerLinks.tutorial.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      <span className="text-xs">↗</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © {currentYear} Data Aggregator Platform. Built for educational purposes.
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Code className="w-4 h-4" />
                <span>Generated with Claude Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
