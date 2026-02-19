import React from 'react';

import PageHeader from '../../components/layout/PageHeader';

const PayoutList = () => {
  return (
    <div className="p-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Payouts' }
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payouts</h1>
      </div>
      <p>This page is under construction...</p>
    </div>
  );
};

export default PayoutList;
