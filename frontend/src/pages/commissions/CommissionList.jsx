import React from 'react';

import PageHeader from '../../components/layout/PageHeader';

const CommissionList = () => {
  return (
    <div className="p-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Commissions' }
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commissions</h1>
      </div>
      <p>This page is under construction...</p>
    </div>
  );
};

export default CommissionList;
