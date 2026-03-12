import { DashboardService } from '../services/DashboardService.js';

const dashboardService = new DashboardService();

export const getDashboard = async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user.id, req.validated);
  res.json(dashboard);
};
