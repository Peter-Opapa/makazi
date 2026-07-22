export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: auth guard; role-aware Sidebar shell
  return <>{children}</>;
}
