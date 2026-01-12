'use client';

import { useMemo } from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
  icon: string;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters',
    test: (pwd) => pwd.length >= 8,
    icon: '✓',
  },
  {
    label: 'One uppercase letter',
    test: (pwd) => /[A-Z]/.test(pwd),
    icon: '✓',
  },
  {
    label: 'One lowercase letter',
    test: (pwd) => /[a-z]/.test(pwd),
    icon: '✓',
  },
  {
    label: 'One number',
    test: (pwd) => /[0-9]/.test(pwd),
    icon: '✓',
  },
  {
    label: 'One symbol',
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
    icon: '✓',
  },
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  // Analyze password with zxcvbn
  const zxcvbnResult = useMemo(() => {
    if (password.length === 0) return null;
    return zxcvbn(password);
  }, [password]);

  // Check basic requirements
  const metRequirements = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      met: req.test(password),
    }));
  }, [password]);

  // Combine zxcvbn score with basic requirements
  // zxcvbn score is 0-4, but we want to consider both
  const allMet = metRequirements.every((req) => req.met);
  const basicScore = metRequirements.filter((req) => req.met).length;
  
  // Use zxcvbn score as primary, but ensure basic requirements are met
  const zxcvbnScore = zxcvbnResult?.score ?? 0;
  const effectiveScore = allMet ? zxcvbnScore : Math.min(zxcvbnScore, 2);
  
  const strengthLevel = useMemo(() => {
    if (password.length === 0) return { label: '', color: '', barColor: '' };
    
    // If basic requirements not met, show as weak
    if (!allMet) {
      return { 
        label: 'Weak', 
        color: 'text-red-600 bg-red-50 border-red-200',
        barColor: 'bg-red-500'
      };
    }
    
    // Use zxcvbn score for strength assessment
    if (effectiveScore === 0) return { 
      label: 'Very Weak', 
      color: 'text-red-600 bg-red-50 border-red-200',
      barColor: 'bg-red-500'
    };
    if (effectiveScore === 1) return { 
      label: 'Weak', 
      color: 'text-red-600 bg-red-50 border-red-200',
      barColor: 'bg-red-500'
    };
    if (effectiveScore === 2) return { 
      label: 'Fair', 
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      barColor: 'bg-orange-500'
    };
    if (effectiveScore === 3) return { 
      label: 'Good', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      barColor: 'bg-yellow-500'
    };
    return { 
      label: 'Strong', 
      color: 'text-green-600 bg-green-50 border-green-200',
      barColor: 'bg-green-500'
    };
  }, [effectiveScore, password.length, allMet]);

  // Get user-friendly messages from zxcvbn
  const warningMessage = zxcvbnResult?.feedback?.warning;
  const suggestions = zxcvbnResult?.feedback?.suggestions || [];
  
  // Check if password is in dictionary/common
  const isCommonPassword = zxcvbnResult && (
    zxcvbnResult.score <= 1 || 
    warningMessage?.toLowerCase().includes('common') ||
    warningMessage?.toLowerCase().includes('dictionary')
  );

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Indicator Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthLevel.barColor}`}
            style={{ width: `${((effectiveScore + 1) / 5) * 100}%` }}
          />
        </div>
        {strengthLevel.label && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${strengthLevel.color}`}>
            {strengthLevel.label}
          </span>
        )}
      </div>

      {/* Dictionary/Common Password Warning - Only show after all basic requirements are met */}
      {allMet && isCommonPassword && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-bold text-sm">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                This password is too common or easily guessable
              </p>
              <p className="text-xs text-red-700 mt-1">
                Please choose a more unique password to better protect your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* zxcvbn Warning Message - Only show after all basic requirements are met */}
      {allMet && warningMessage && !isCommonPassword && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold text-sm">ℹ</span>
            <p className="text-sm text-yellow-800 capitalize">
              {warningMessage}
            </p>
          </div>
        </div>
      )}

      {/* zxcvbn Suggestions - Only show after all basic requirements are met */}
      {allMet && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs font-medium text-blue-800 mb-1.5">Suggestions to improve your password:</p>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-blue-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="capitalize">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700 mb-1">Password requirements:</p>
        {metRequirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                req.met
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-gray-600' : 'text-gray-400'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
