import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import HomeContent from "../../components/shared/HomeContent";

export default function PublicHomePage() {
  return (
    <>
      <NavbarPublic />
      <HomeContent mode="public" />
      <FooterPublic />
    </>
  );
}
