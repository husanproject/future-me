import React from 'react';
import { RoleId } from '../types/auth';
import { ShieldCheck, ShieldAlert, UserCheck, ShoppingCart, Package, Calculator } from 'lucide-react';

interface Props {
  roleId: RoleId;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<Props> = ({ roleId, displayName, size = 'md' }) => {
  const getRoleConfig = () => {
    switch (roleId) {
      case 'SUPER_ADMIN':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />,
          label: displayName || 'Admin'
        };
      case 'CASHIER':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />,
          label: displayName || 'Kassir'
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          label: roleId
        };
    }
  };

  const config = getRoleConfig();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
