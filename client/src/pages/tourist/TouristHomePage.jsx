// client/src/pages/tourist/TouristHomePage.jsx
import NavbarTourist from "../../components/tourist/NavbarTourist";
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
