import React from 'react';
import PropTypes from 'prop-types';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  RotateCcw, Send, Calendar, CreditCard 
} from 'lucide-react';
import Badge from './Badge';

/**
 * Specialized badge for booking, payment and user statuses
 */
const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toLowerCase();

  const getStatusConfig = (s) => {
    switch (s) {
      // Booking Statuses
      case 'pending': return { variant: 'warning', icon: Clock, label: 'Pending' };
      case 'confirmed': return { variant: 'indigo', icon: CheckCircle, label: 'Confirmed' };
      case 'ongoing': return { variant: 'info', icon: RotateCcw, label: 'Ongoing' };
      case 'completed': return { variant: 'success', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { variant: 'danger', icon: XCircle, label: 'Cancelled' };
      
      // Payment Statuses
      case 'captured': return { variant: 'success', icon: CreditCard, label: 'Paid' };
      case 'failed': return { variant: 'danger', icon: AlertCircle, label: 'Failed' };
      case 'refunded': return { variant: 'warning', icon: RotateCcw, label: 'Refunded' };
      
      // User/Provider Statuses
      case 'active': return { variant: 'success', label: 'Active' };
      case 'blocked': return { variant: 'danger', label: 'Blocked' };
      case 'pending_verification': return { variant: 'warning', icon: Clock, label: 'Verifying' };
      case 'verified': return { variant: 'success', icon: CheckCircle, label: 'Verified' };
      
      default: return { variant: 'default', label: s };
    }
  };

  const config = getStatusConfig(normalizedStatus);

  return <Badge {...config} />;
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

export default StatusBadge;
