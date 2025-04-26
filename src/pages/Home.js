import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import FoodItemCard from "../components/FoodItemCard";
import styled from "styled-components";
import "../index.css";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import loadingAnimation from "../assets/loading_animation.json";
import { useLocation, useNavigate } from "react-router-dom"; // 👈 Add these
import LoginPopup from "../components/LoginPopup";
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
  padding: 0;
`;

const MainContent = styled.div`
  paddingTop: 10px;
  flex: 1 0 auto;
  paddingBottom: 0;
`;

const Title = styled.div`
  h2 {
    text-align: left;
    margin-left: 2.5rem;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const FoodSection = styled.section`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 2rem;
`;

const Home = () => {
  const [topFoods, setTopFoods] = useState([]);
  const [topFoodsCountry, setTopFoodsCountry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation("global");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Show popup if redirected due to auth
    if (location.state?.reason === "loginRequired") {
      setShowLoginPopup(true);
      // Clear state after first use
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);
  useEffect(() => {
    let isMounted = true;

    const fetchFoods = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/food/top-5-foods", {
          headers: { "Cache-Control": "no-cache" },
        });

        if (isMounted) {
          if (response.data.length === 0) {
            setError("No food items found.");
          } else {
            setTopFoods(response.data);
          }
        }

        const response_by_country = await axios.get("http://localhost:8000/food/top-foods-by-country", {
          headers: { "Cache-Control": "no-cache" },
        });

        if (isMounted) {
          if (response_by_country.data.length === 0) {
            setError("No food items found.");
          } else {
            setTopFoodsCountry(response_by_country.data);
          }
        }
      } catch (error) {
        if (isMounted) {
          setError("Error fetching food items.");
          console.error("API Error:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFoods();

    return () => {
      isMounted = false;
    };
  }, []);
  const handleLoginPopupClose = () => setShowLoginPopup(false);
  const handleLoginRedirect = () => navigate('/login');
  return (
    <PageContainer>
      <Header />
      {/* Main Content */}
      <MainContent>
      <LoginPopup
          open={showLoginPopup}
          onClose={handleLoginPopupClose}
          onLogin={handleLoginRedirect}
          messageKey="accessProfile" // Optional translation key
        />
        <Hero />
        <Title>
          <h2>{t("topFoods")}</h2>
        </Title>
        <FoodSection>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Lottie
                animationData={loadingAnimation}
                loop={true}
                style={{ height: 120, width: 120, margin: "0 auto" }} // 👈 Smaller size here
              />
            </div>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : topFoods.length > 0 ? (
            topFoods.map((food) => <FoodItemCard key={food.id} food={food} />)
          ) : (
            <p>No food items available.</p>
          )}
        </FoodSection>
        <Title>
          <h2>{t("topFoodsCountry")}</h2>
        </Title>
        <FoodSection>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
            <Lottie
              animationData={loadingAnimation}
              loop={true}
              style={{ height: 120, width: 120, margin: "0 auto" }} // 👈 Smaller size here
            />
          </div>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : topFoodsCountry.length > 0 ? (
            topFoodsCountry.map((food) => <FoodItemCard key={food.id} food={food} />)
          ) : (
            <p>No food items available.</p>
          )}
        </FoodSection>
      </MainContent>
      <Footer />
    </PageContainer>
  );
};

export default Home;
