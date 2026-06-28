import Navbar from "@/components/generic/essentials/Navbar";
import Footer from "@/components/generic/essentials/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
