import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, Rating, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate'; // ✅ Add this
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FoodInProfile = ({
  food,
  onRateChange,
  onCommentUpdate,
  ingredientsList,
  isWannaTry = false,
  readOnly = true,
  onRemoveFromWannaTry,
  isOwnProfile = true, // ✅ default true
}) => {
  const [imageUrl, setImageUrl] = useState(
    food.imageUrl || `${process.env.PUBLIC_URL}/default-food.png`
  );
  const [localComment, setLocalComment] = useState(food.comment || "");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState(food.comment || "");
  const [originalComment, setOriginalComment] = useState(food.comment || "");
  const [translatedComment, setTranslatedComment] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const navigate = useNavigate();
  const { i18n, t } = useTranslation("global");

  useEffect(() => {
    const fetchSignedImageUrl = async () => {
      try {
        if (food.url_id) {
          const response = await axios.get(`http://localhost:8000/food/image/${food.url_id}`);
          setImageUrl(response.data.image_url);
        }
      } catch (error) {
        console.error("Error fetching signed image URL:", error);
      }
    };

    fetchSignedImageUrl();
  }, [food.url_id]);

  const getLocalizedIngredient = (enName) => {
    const match = ingredientsList?.find((item) => item.en === enName);
    return match ? (i18n.language === "tr" ? match.tr : match.en) : enName;
  };

  const handleTranslateComment = async () => {
    if (!food.comment || translatedComment) return;
    try {
      setIsTranslating(true);
      const response = await axios.post("http://localhost:8000/translation/", {
        text: food.comment,
        target_lang: i18n.language,
      });
      setTranslatedComment(response.data.translated_text);
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedComment(t("translationError"));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveComment = () => {
    setIsEditingComment(false);
    if (editedComment !== originalComment && onCommentUpdate) {
      setLocalComment(editedComment); // show the new comment immediately
      onCommentUpdate(food.foodId, editedComment);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingComment(false);
    setEditedComment(originalComment); // restore original comment
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      padding={2}
      gap={2}
      sx={{ border: "1px solid #ddd", borderRadius: 2 }}
    >
      <Avatar
        src={imageUrl}
        alt={food.name}
        variant="rounded"
        sx={{ width: 90, height: 90 }}
      />
  
      <Box flex={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h6"
            sx={{
              cursor: "pointer",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
            onClick={() => navigate(`/food/${food.foodId}`)}
          >
            {food.name}
          </Typography>
  
          {isWannaTry ? (
            <IconButton
              onClick={() => onRemoveFromWannaTry && onRemoveFromWannaTry(food.foodId)}
              size="small"
              color="error"
              sx={{ p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="textSecondary">
                {food.popularity?.rating ? food.popularity.rating.toFixed(1) : "N/A"}
              </Typography>
              <Rating
                name={`user-rating-${food.foodId}`}
                value={food.rate || 0}
                onChange={(event, newValue) => onRateChange(food.foodId, newValue)}
                precision={1}
                size="small"
              />
            </Box>
          )}
        </Box>
  
        <Typography variant="body2" color="textSecondary">
          {t(`country.${food.country}`)}
        </Typography>
        <Typography variant="body2" color="textSecondary" marginTop={1}>
          {t("ingredients")}: {
            food.ingredients
              ? food.ingredients.map(ingredient => {
                  const normalized = ingredient.toLowerCase().replace(/\s+/g, '');
                  return t(`food_ingredients.${normalized}`).toLowerCase();
                }).join(", ")
              : t("unknown")
          }
        </Typography>
  
        {!isWannaTry && (
          <Box marginTop={1}>
            {isEditingComment ? (
              <Box display="flex" flexDirection="column" gap={1}>
                <textarea
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "0.9rem",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    resize: "vertical"
                  }}
                />
                <Box display="flex" gap={1}>
                  <IconButton size="small" onClick={handleSaveComment}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEdit}>
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontStyle: localComment ? "italic" : "normal" }}
                  >
                    {localComment ? `"${localComment}"` : t("noComment")}
                  </Typography>
  
                  <Box display="flex" alignItems="center" gap={1}>
                    {readOnly ? (
                      localComment && (
                        <IconButton
                          size="small"
                          onClick={handleTranslateComment}
                          disabled={isTranslating}
                        >
                          {isTranslating ? (
                            <Typography variant="caption">{t("loading")}...</Typography>
                          ) : (
                            <TranslateIcon fontSize="small" />
                          )}
                        </IconButton>
                      )
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setOriginalComment(localComment);
                          setEditedComment(localComment);
                          setIsEditingComment(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                </Box>
  
                {/* Translated comment */}
                {readOnly && translatedComment && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      bgcolor: "#f5f5f5",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                    >
                      {t("translated")}:
                    </Typography>
                    <Typography variant="body2">
                      {translatedComment}
                    </Typography>
                  </Box>
                )}

              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );  
};

export default FoodInProfile;
