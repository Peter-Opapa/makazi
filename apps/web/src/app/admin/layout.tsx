export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: internal staff auth guard + Sidebar shell
  return <>{children}</>;
}
