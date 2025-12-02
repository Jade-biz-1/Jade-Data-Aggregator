"""
CORS Configuration
Environment-specific CORS settings
"""

import os
from typing import List


class CORSConfig:
    """
    CORS configuration for different environments
    """

    @staticmethod
    def get_allowed_origins() -> List[str]:
        """
        Get allowed origins based on environment
        """
        environment = os.getenv('ENVIRONMENT', 'development')

        if environment == 'production':
            # Production: Only allow specific domains
            return [
                'https://app.dataaggregator.com',
                'https://www.dataaggregator.com',
                'https://api.dataaggregator.com',
            ]
        elif environment == 'staging':
            # Staging: Allow staging domains
            return [
                'https://staging.dataaggregator.com',
                'https://staging-api.dataaggregator.com',
                'http://localhost:3000', # Allow local frontend for staging API
            ]
        else:
            # Development: Allow localhost on common ports
            return [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8000',
                'http://localhost:8001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:8000',
                'http://127.0.0.1:8001',
            ]

    @staticmethod
    def get_cors_config() -> dict:
        """
        Get complete CORS configuration
        """
        environment = os.getenv('ENVIRONMENT', 'development')

        return {
            'allow_origins': CORSConfig.get_allowed_origins(),
            'allow_credentials': True,
            'allow_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            'allow_headers': [
                'Authorization',
                'Content-Type',
                'Accept',
                'Origin',
                'User-Agent',
                'DNT',
                'Cache-Control',
                'X-Requested-With',
                'X-CSRF-Token',
            ],
            'expose_headers': [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'Retry-After',
            ],
            'max_age': 600 if environment == 'production' else 300,
        }