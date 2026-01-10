import NavbarTourist from "../../components/tourist/NavBarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import HomeContent from "../../components/shared/HomeContent";

export default function TouristHomePage() {
  return (
    <>
      <NavbarTourist />
      <HomeContent mode="tourist" />
      <FooterTourist />
    </>
  );
}
