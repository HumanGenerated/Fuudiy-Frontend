// src/pages/Explore.js

import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import axios from "axios";
import {
  Box,
  Typography,
  Grid2,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Skeleton,
  Fade,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_BASE_URL = "http://localhost:8000";

const Explore = () => {
  const { t } = useTranslation("global");
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    similar: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const token = localStorage.getItem("accessToken");

  const availableCountries = [
    "Spanish",
    "Mexican",
    "Vietnamese",
    "Thai",
    "Turkish",
    "Korean",
    "Italian",
    "Japanese",
    "French",
    "Chinese",
    "American",
    "Brazilian",
    "Indian",
    "Greek",
    "German",
    "British",
  ];

  const loadingMessageKeys = [
    "explorePage.loading.finding",
    "explorePage.loading.searching",
    "explorePage.loading.cooking",
    "explorePage.loading.gathering",
    "explorePage.loading.exploring",
    "explorePage.loading.preparing",
  ];
  const [loadingMessage, setLoadingMessage] = useState("");

  // cycle through loading messages
  useEffect(() => {
    if (!loading) return;
    const pick = () =>
      t(
        loadingMessageKeys[
          Math.floor(Math.random() * loadingMessageKeys.length)
        ]
      );
    setLoadingMessage(pick());
    const iv = setInterval(() => setLoadingMessage(pick()), 2000);
    return () => clearInterval(iv);
  }, [loading, t]);

  // fetch current user
  useEffect(() => {
    axiosInstance
      .get("/auth/users/me")
      .then((res) => {
        const u = res.data?.data?.[0];
        if (u) setUser(u);
      })
      .catch(console.error);
  }, []);

  // Parse strings or objects into a uniform food shape
  const transformFoodData = (arr) =>
    (arr || []).map((item) => {
      let f;
      if (typeof item === "string") {
        try {
          f = JSON.parse(item);
        } catch (e) {
          console.error("Parse error on", item, e);
          f = {};
        }
      } else {
        f = item;
      }
      return {
        id: f._id || f.id,
        name: f.name,
        country: f.country || selectedCountry,
        ingredients: f.ingredients || [],
        score:
          typeof f.score === "number"
            ? Math.round(f.score * 100) / 100
            : undefined,
        rating: f.average_rating,
        similarUsers: f.similar_user_count,
        similarity: f.similarity,
        url_id: f.url_id,
        imageUrl: null,
      };
    });

  // fetch recommendations when country or user changes
  useEffect(() => {
    if (!selectedCountry || !user?._id) return;
    setLoading(true);

    axiosInstance.get(`/explore/recommend/`, {  // Remove API_BASE_URL prefix
      params: { country: selectedCountry },
      headers: {
        "X-User-ID": user._id,
      },
    })
      .then((res) => {
        setRecommendations({
          personalized: transformFoodData(
            res.data.personalized_recommendations
          ),
          similar: transformFoodData(res.data.similar_users_recommendations),
        });
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        const code = err.response?.status;
        const msgs = {
          401: t("errors.auth"),
          403: t("errors.auth"),
          500: t("errors.server"),
          default: t("errors.generic"),
        };
        setError(msgs[code] || msgs.default);
        setRecommendations({ personalized: [], similar: [] });
      })
      .finally(() => setTimeout(() => setLoading(false), 800));
  }, [selectedCountry, user, token, t]);

  // handle “similar” searches
  const handleSimilarSearch = async (foodId) => {
    if (!selectedCountry || !foodId || !user?._id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/explore/similar/${foodId}`,  // Remove API_BASE_URL prefix
        {
          params: { country: selectedCountry },
          headers: {
            "X-User-ID": user._id,
          },
        }
      );
      setRecommendations((prev) => ({
        ...prev,
        similar: transformFoodData(res.data.results),
      }));
      setError(null);
    } catch (err) {
      console.error(err);
      const code = err.response?.status;
      const msgs = {
        401: t("errors.auth"),
        403: t("errors.auth"),
        500: t("errors.server"),
        default: t("errors.generic"),
      };
      setError(msgs[code] || msgs.default);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  // —— inline FoodItemCard —— 
  const FoodItemCard = ({ food, type, onSimilarSearch }) => {
    const [imgUrl, setImgUrl] = useState(
      food.imageUrl || `${process.env.PUBLIC_URL}/default-food.png`
    );
    const [imgLoading, setImgLoading] = useState(true);

    useEffect(() => {
      const fetchSignedImageUrl = async () => {
        try {
          if (food.url_id) {
            const { data } = await axios.get(
              `${API_BASE_URL}/food/image/${food.url_id}`
            );
            if (data.image_url) {
              setImgUrl(data.image_url);
            }
          }
        } catch (error) {
          console.error("Error fetching signed image URL:", error);
        } finally {
          setImgLoading(false);
        }
      };

      fetchSignedImageUrl();
    }, [food.url_id]);

    return (
      <Card
        onClick={() => window.open(`/food/${food.id}`, "_blank")}  // ← new tab
        variant="outlined"
        sx={{
          cursor: "pointer",
          width: "100%",
          maxWidth: 300,
          height: 500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: 3,
          borderRadius: 2,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": { transform: "translateY(-8px)", boxShadow: 6 },
        }}
      >
      <CardHeader
        title={food.name}
        subheader={
          type === "personalized"
            ? `${t("explorePage.score")}: ${food.score?.toFixed(2)}`
            : `${t("explorePage.rating")}: ${
                food.rating?.toFixed(1) ?? t("explorePage.not_available")
              }`
        }
        action={<CountryFlag country={food.country} />}
        sx={{ height: 80, overflow: "hidden" }}
        titleTypographyProps={{
            sx: {
            fontSize: "0.95rem",
            fontWeight: "bold",
            maxWidth: "calc(100% - 40px)",
          },
        }}
        subheaderTypographyProps={{
          noWrap: true,
          sx: {
            fontSize: "0.8rem",
            maxWidth: "calc(100% - 40px)",
          },
        }}
      />
        <Box sx={{ height: 220, position: "relative" }}>
          {imgLoading ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
            />
          ) : (
            <CardMedia
              component="img"
              height="200"
              image={imgUrl}
              alt={food.name}
              onLoad={() => setImgLoading(false)}
              sx={{
                objectFit: "cover",
                transition: "transform 0.4s",
                "&:hover": { transform: "scale(1.08)" },
              }}
            />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, overflow: "auto" }}>
          <Typography variant="subtitle2" gutterBottom>
            {t("explorePage.key_ingredients")}:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {food.ingredients.slice(0, 5).map((ing, i) => {
              const normalizedIngredient = ing.toLowerCase().replace(/\s+/g, '');
              
              return (
                <Chip key={i} label={t(`food_ingredients.${normalizedIngredient}`).toLowerCase()} size="small" />
              );
            })}
            {food.ingredients.length > 5 && (
              <Chip
                label={t("explorePage.more_ingredients", {
                  count: food.ingredients.length - 5,
                })}
                size="small"
              />
            )}
          </Box>
        </CardContent>
        <CardActions sx={{ height: 60, justifyContent: "space-between" }}>
          {type === "similar" && (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                onSimilarSearch(food.id);
              }}
              sx={{ borderRadius: 4, boxShadow: 2, "&:hover": { boxShadow: 4 } }}
            >
              {t("explorePage.similar_to_this")}
            </Button>
          )}
          <Box>
            {food.similarity != null && (
              <Typography variant="body2" color="text.secondary">
                {t("explorePage.match")}:{" "}
                {(food.similarity * 100).toFixed(1)}%
              </Typography>
            )}
            {type === "similar" && food.similarUsers != null && (
              <Typography variant="body2" color="text.secondary">
                {t("explorePage.users_liked", {
                  count: food.similarUsers,
                })}
              </Typography>
            )}
          </Box>
        </CardActions>
      </Card>
    );
  };
  FoodItemCard.propTypes = {
    food: PropTypes.object.isRequired,
    type: PropTypes.oneOf(["personalized", "similar"]),
    onSimilarSearch: PropTypes.func,
  };

  // skeleton loader
  const LoadingPlaceholders = () => (
    <Grid2 container spacing={4} justifyContent="center" sx={{ px: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid2
          key={i}
          item
          xs={6}
          sm={6}
          md={3}
          lg={3}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Card
            sx={{
              width: 320,
              height: 400,
              boxShadow: 2,
              borderRadius: 2,
            }}
          >
            <Box sx={{ p: 2 }}>
              <Skeleton height={40} width="80%" animation="wave" />
              <Skeleton height={20} width="50%" animation="wave" />
            </Box>
            <Skeleton
              variant="rectangular"
              height={200}
              animation="wave"
            />
            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Skeleton height={30} width="60%" animation="wave" />
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  mt: 1,
                }}
              >
                <Skeleton height={24} width="25%" animation="wave" />
                <Skeleton height={24} width="30%" animation="wave" />
                <Skeleton height={24} width="20%" animation="wave" />
              </Box>
            </Box>
            <Box sx={{ p: 2, height: 60 }}>
              <Skeleton height={36} width="40%" animation="wave" />
            </Box>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  );

  return (
    <>
      <Header />
      <Box sx={{ mt: 8, maxWidth: 1440, mx: "auto", p: 2 }}>
        {/* Title */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3">{t("explore")} 🌍</Typography>
          <Typography>{t("exploreWriting")}</Typography>
        </Box>

        {/* Country picker */}
        <Box textAlign="center" mb={4}>
          <Grid2 container spacing={1} justifyContent="center">
            {availableCountries.map((c) => (
              <Grid2 key={c} item>
                <Button
                  onClick={() => {
                    setSelectedCountry(c);
                    setError(null);
                    setRecommendations({ personalized: [], similar: [] });
                  }}
                  variant={selectedCountry === c ? "contained" : "outlined"}
                  sx={{
                    width: 80,
                    height: 50,
                    p: 2,
                    borderRadius: 2,
                    backgroundImage: `url('/countries/${c}.png')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "white",
                    textShadow: "0 0 4px rgba(0,0,0,0.8)",
                    fontWeight: "bold",
                    "&:hover": {
                      opacity: 0.9,
                      transform: "scale(1.05)",
                    },
                    transition: "transform 0.2s",
                  }}
                />
              </Grid2>
            ))}
          </Grid2>
        </Box>

        {/* Main content */}
        <Box minHeight={400} position="relative">
          {loading && (
            <Fade in>
              <Box>
                <Box textAlign="center" mb={4}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" mt={2}>
                    {loadingMessage}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={1}
                  >
                    {t("explorePage.loading.searching_cuisine", {
                      country: selectedCountry || t("explorePage.global"),
                    })}
                  </Typography>
                </Box>
                <LoadingPlaceholders />
              </Box>
            </Fade>
          )}

          {!loading && error && (
            <Alert
              severity="error"
              variant="filled"
              sx={{ mx: "auto", maxWidth: 600, my: 2 }}
            >
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              {/* Personalized */}
              {recommendations.personalized.length > 0 ? (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>
                    {t("PersonalizedRecommendations")}
                  </Typography>
                  <Grid2
                    container
                    spacing={2}
                    justifyContent="center"
                    sx={{ px: 2 }}
                  >
                    {recommendations.personalized.map((f) => (
                      <Grid2
                        key={f.id}
                        item
                        xs={6}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={{ display: "flex" }}
                      >
                        <FoodItemCard food={f} type="personalized" />
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              ) : (
                selectedCountry && (
                  <Typography
                    textAlign="center"
                    color="text.secondary"
                    py={4}
                  >
                    {t("explorePage.no_foods", {
                      country: selectedCountry,
                    })}
                  </Typography>
                )
              )}

              {/* Similar */}
              {recommendations.similar.length > 0 && (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>
                    {t("FoodsYouMayLike")}
                  </Typography>
                  <Grid2
                    container
                    spacing={2}
                    justifyContent="center"
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      p: 2,
                      px: 2,
                    }}
                  >
                    {recommendations.similar.map((f) => (
                      <Grid2
                        key={f.id}
                        item
                        xs={6}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={{ display: "flex" }}
                      >
                        <FoodItemCard
                          food={f}
                          type="similar"
                          onSimilarSearch={handleSimilarSearch}
                        />
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
};

const CountryFlag = ({ country }) => {
  // Could be more robust, but these are examples
  const flagMap = {
    korean: "🇰🇷",
    mexican: "🇲🇽",
    japanese: "🇯🇵",
    italian: "🇮🇹",
    french: "🇫🇷",
    chinese: "🇨🇳",
    thai: "🇹🇭",
    turkish: "🇹🇷",
    spanish: "🇪🇸",
    american: "🇺🇸",
    brazilian: "🇧🇷",
    vietnamese: "🇻🇳",
    greek: "🇬🇷",
    german: "🇩🇪",
    british: "🇬🇧",
    indian: "🇮🇳",
  };
  const lower = String(country).toLowerCase();
  const symbol = flagMap[lower] || "🌍";
  return (
    <Box sx={{ display: "flex", alignItems: "center", height: 24 }}>
      <Typography variant="body2" fontSize="1.25rem">
        {symbol}
      </Typography>
    </Box>
  );
};

CountryFlag.propTypes = {
  country: PropTypes.string,
};

export default Explore;