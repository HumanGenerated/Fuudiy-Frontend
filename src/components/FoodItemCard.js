// src/components/FoodItemCard.js
import React, { useState, useEffect } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Skeleton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const defaultImage = `${process.env.PUBLIC_URL}/default-food.png`;

const FoodItemCard = ({ food }) => {
  const { t } = useTranslation("global");
  const navigate = useNavigate();

  // 1) Start with no URL (null) if we expect to fetch it
  //    If there's no url_id, we'll immediately set fallback below.
  const [imageUrl, setImageUrl] = useState(food.url_id ? null : (food.imageUrl || defaultImage));

  // 2) Are we fetching a signed URL?
  const [loadingUrl, setLoadingUrl] = useState(!!food.url_id);

  // 3) Has the <img> itself finished loading?
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;

    // If there's a url_id, fetch its signed URL
    if (food.url_id) {
      setLoadingUrl(true);
      axios
        .get(`https://fuudiy.com/api/food/image/${food.url_id}`)
        .then(({ data }) => {
          if (!canceled && data.image_url) {
            setImageUrl(data.image_url);
          }
        })
        .catch((err) => {
          console.error("Error fetching signed image URL:", err);
          // fall back to default
          if (!canceled) {
            setImageUrl(food.imageUrl || defaultImage);
          }
        })
        .finally(() => {
          if (!canceled) setLoadingUrl(false);
        });
    } 
    // No url_id: we already seeded imageUrl above, so mark loaded immediately
    else {
      setImgLoaded(true);
    }

    return () => {
      canceled = true;
    };
  }, [food.url_id, food.imageUrl]);

  const handleClick = () => {
    navigate(`/food/${food.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        width: 250,
        height: 270,
        m: 1,
        borderRadius: 2,
        boxShadow: 3,
        cursor: "pointer",
        transition: "transform 0.2s ease-in-out",
        "&:hover": { transform: "scale(1.05)" },
        overflow: "hidden",
      }}
    >
      {/* IMAGE CONTAINER */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 150,
          bgcolor: "#f0f0f0",
        }}
      >
        {/* Show skeleton while either fetching URL or waiting for <img> load */}
        {(loadingUrl || !imgLoaded) && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: "absolute", top: 0, left: 0 }}
          />
        )}

        {/* Render the image once we have a URL; hide until loaded */}
        {imageUrl && (
          <CardMedia
            component="img"
            src={imageUrl}
            alt={food.name || "Food Item"}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              // if signed URL fails to load, fallback once more:
              if (imageUrl !== defaultImage) {
                setImageUrl(defaultImage);
              }
              setImgLoaded(true);
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: imgLoaded ? "block" : "none",
            }}
          />
        )}
      </Box>

      {/* FOOD INFO */}
      <CardContent>
        <Typography variant="h6" gutterBottom noWrap>
          {food.name || t("unknownFood")}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {t(`country.${food.country}`, { defaultValue: food.country || t("unknownCountry") })}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default FoodItemCard;