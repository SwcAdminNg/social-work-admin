import Navbar from "../generic/essentials/Navbar";
import CourseCategories from "./CourseCategories";
import CTABanner from "./CTABanner";
import FeaturedCourses from "./FeaturedCourses";
import Hero from "./Hero";
import LearningTransform from "./LearningTransform";
import WhyChooseUs from "./WhyChooseUs";

export default function Home() {
  return (
    <main>
      <Hero />
      <WhyChooseUs />
      <CourseCategories />
      <LearningTransform />
      <FeaturedCourses />
      <CTABanner />
    </main>
  );
}
