import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Rating,
  Stack,
  ToggleButtonGroup,
  List,
  ListItem,
  ToggleButton
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Header from "../components/Header";
import Footer from "../components/Footer";
import Comments from "../components/Comments";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import loadingAnimation from "../assets/loading_animation.json";
import styled from "styled-components";


const API_BASE_URL = 'http://localhost:8000'; 

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
  padding: 0;
`;

const MainContent = styled.div`
  flex: 1 0 auto;
  padding-bottom: 0;
  padding-top: 35px;
`;

const FoodDetailPage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation("global");
  const [foodDetails, setFoodDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInList, setisInList] = useState(false);
  const [view, setView] = useState("ingredients");
  const [imageUrl, setImageUrl] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [hasCommented, setHasCommented] = useState(false);
  const [keywordTranslations, setKeywordTranslations] = useState([]);

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/food/${id}`);
        const foodData = response.data;
        setFoodDetails(foodData);
  
        if (foodData.url_id) {
          const imageResponse = await axios.get(`${API_BASE_URL}/food/image/${foodData.url_id}`);
          setImageUrl(imageResponse.data.image_url);
        }
      } catch (error) {
        setError(t("errorFetching"));
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const user = response.data.data[0];
        setCurrentUser(user);
  
        const [surveyRes, commentRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/survey/user/${user.username}`),
          axios.get(`${API_BASE_URL}/comments/has-commented/${id}/${user.username}`)
        ]);
  
        const wannaTryList = surveyRes.data.wannaTry || [];
        if (wannaTryList.includes(id)) {
          setisInList(true);
        }
  
        if (commentRes.data.hasCommented) {
          setHasCommented(true);
        }
  
      } catch (err) {
        console.error("Failed to fetch user data or comment info:", err);
      }
    };
  
    fetchFoodDetails();
    fetchCurrentUser();
  }, [id, t]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res = await fetch(`${process.env.PUBLIC_URL}/keyword_translations.json`);
        const data = await res.json();
        setKeywordTranslations(data);
      } catch (err) {
        console.error("Failed to load keyword translations", err);
      }
    };
  
    fetchTranslations();
  }, []);
  
  // Function to update the food rating from the Comments component
  const updateFoodRating = (newRating, votes) => {
    setFoodDetails(prev => ({
      ...prev,
      popularity: { rating: newRating, votes: votes }
    }));
  };

  const handleListToggle = async () => {
    if (!currentUser?.username) {
      console.warn("No username found for the current user.");
      return;
    }
  
    try {
      if (isInList) {
        await axios.delete(
          `${API_BASE_URL}/survey/remove-from-wanna-try/${currentUser.username}/${id}`
        );
        setisInList(false);
      } else {
        await axios.post(
          `${API_BASE_URL}/survey/add-to-wanna-try/${currentUser.username}/${id}`
        );
        setisInList(true);
      }
    } catch (err) {
      console.error("Failed to toggle wannaTry:", err);
    }
  }; 

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Lottie
          animationData={loadingAnimation}
          loop
          style={{ height: 120, width: 120 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", marginTop: "50px" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const foodImage = imageUrl || `${process.env.PUBLIC_URL}/default-food.png`;

  return (
    <PageContainer>
      <Header />
      <MainContent>
      <Box sx={{ maxWidth: "1400px", margin: "0 auto", padding: "30px" }}>
        <Paper elevation={3} sx={{ padding: "30px", borderRadius: "20px", marginBottom: "30px" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={5} alignItems="center">
            <Card sx={{ borderRadius: "16px", boxShadow: 3, maxWidth: 500 }}>
              <CardMedia component="img" height="300" image={foodImage} alt={foodDetails.name} />
            </Card>
            <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" }, position: "relative", padding: "20px" }}>
              <Box sx={{ position: "absolute", top: 0, right: 0 }}>
                {currentUser && (
                  <Tooltip title={isInList ? t("removeFromList") : t("addToList")}>
                    <IconButton
                      onClick={handleListToggle}
                      color={isInList ? "error" : "default"}
                      sx={{ fontSize: "1rem", padding: "4px" }}
                    >
                      {isInList ? <CloseIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ marginBottom: "10px" }}>
                {foodDetails.name}, { t(`country.${foodDetails.country}`)}
              </Typography>
              <Rating
                name="read-only"
                value={foodDetails.popularity.rating || 0}
                readOnly
                precision={0.5}
                sx={{ 
                  marginBottom: "10px",
                  "& .MuiRating-iconFilled": { color: "#FFD700" },
                  "& .MuiRating-iconEmpty": { color: "#C0C0C0" },
                }} 
              />              
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
                {foodDetails.keywords.map((keyword, index) => {
                  const translation = keywordTranslations.find(item => item.en === keyword);
                  const displayKeyword = i18n.language === "tr"
                    ? translation?.tr || keyword
                    : translation?.en || keyword;

                  return (
                    <Chip
                      key={index}
                      label={displayKeyword}
                      sx={{ backgroundColor: "#f1f1f1", fontWeight: "bold", fontSize: "1rem", padding: "8px" }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </Paper>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(event, newValue) => setView(newValue)}
          sx={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}
        >
          <ToggleButton value="ingredients">{t("ingredients")}</ToggleButton>
          <ToggleButton value="comments">{t("comments")}</ToggleButton>
        </ToggleButtonGroup>
        <Paper elevation={3} sx={{ padding: "30px", borderRadius: "20px", textAlign: "center" }}>
          {view === "ingredients" ? (
            <>
            <List sx={{ columnCount: 3, gap: "10px" }}>
              {foodDetails.ingredients.map((ingredient, index) => {
                const normalizedIngredient = ingredient.toLowerCase().replace(/\s+/g, '');
                
                return (
                  <ListItem key={index} sx={{ width: "100%", justifyContent: "center" }}>
                    <Paper sx={{ padding: "15px", borderRadius: "10px", backgroundColor: "#f9f9f9", textAlign: "center", width: "50%" }}>
                      <Typography variant="body1" fontWeight="bold">• {t(`food_ingredients.${normalizedIngredient}`).toLowerCase()}</Typography>
                    </Paper>
                  </ListItem>
                );
              })}
            </List>
            </>
          ) : (
            // Pass the update function to Comments
            <Comments onRatingUpdate={updateFoodRating} hasCommented={hasCommented} />          
          )}
        </Paper>
      </Box>
      </MainContent>
      <Footer />
    </PageContainer>
  );
};

export default FoodDetailPage;