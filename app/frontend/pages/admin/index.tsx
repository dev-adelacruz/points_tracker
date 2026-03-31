import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminIndex: React.FC = () => <Navigate to="/admin/teams" replace />;

export default AdminIndex;
