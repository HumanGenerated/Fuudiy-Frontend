// Comments.js
import React, { useState, useEffect } from "react";     
import axiosInstance from "../axiosInstance"; // Use your custom axios instance
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Rating,
  Dialog,
  useTheme,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import TranslateIcon from "@mui/icons-material/Translate";
import { useTranslation } from "react-i18next";
import LoginPopup from "./LoginPopup";

// Reusable StarRating Component
const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          sx={{
            color:
              (readOnly ? value : (hoverRating || value)) >= star
                ? "#FFD700"
                : "#DDDDDD",
            cursor: readOnly ? "default" : "pointer",
            fontSize: readOnly ? 16 : 24,
          }}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          onClick={() => !readOnly && onChange(star)}
        />
      ))}
    </Box>
  );
};

const Comments = ({ onRatingUpdate }) => {
  const { id: food_id } = useParams();
  const [userData, setUserData] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState(null);
  const [translatedComments, setTranslatedComments] = useState({});
  const [translating, setTranslating] = useState({});
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const { t, i18n } = useTranslation("global");
  const navigate = useNavigate();

  // Fetch all comments for the food item
  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`/comments/${food_id}`);
      setComments(response.data);
    } catch (error) {
      setError("Error fetching comments.");
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchComments();
    
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          const userResponse = await axiosInstance.get("/auth/users/me");
          const currentUser = userResponse.data.data[0];
          setUserData(currentUser);
    
          const hasCommentedResponse = await axiosInstance.get(
            `/comments/has-commented/${food_id}/${currentUser.username}`
          );
          setHasCommented(hasCommentedResponse.data.hasCommented);
          console.log("hasCommented: ", hasCommentedResponse.data.hasCommented);
        }
      } catch (error) {
        console.error("Failed to fetch comment status:", error);
      } finally {
        setLoading(false);
      }
    };
    
  
    fetchData();
  }, [food_id]);
  

  const handleCommentSubmit = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setLoginPopupOpen(true);
      return;
    }
  
    // 🛑 Prevent duplicate comment submission
    if (hasCommented) {
      alert(t("alreadyCommentedMessage") || "You’ve already commented on this food.");
      return;
    }
  
    if (!newComment.trim() || rating === 0) return;
  
    try {
      // Get the current user data
      const userResponse = await axiosInstance.get("/auth/users/me");
      const currentUser = userResponse.data.data[0];
      setUserData(currentUser);
  
      // Submit the new comment
      await axiosInstance.post(
        "/comments", 
        {
          foodId: food_id,
          rate: rating,
          comment: newComment,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      // Get current food details to calculate the new rating
      const foodResponse = await axiosInstance.get(`/food/${food_id}`);
      const food = foodResponse.data;
      const currentVotes = food.popularity?.votes || 0;
      const currentRating = food.popularity?.rating || 0;
  
      const newCalculatedRating = ((currentRating * currentVotes + rating) / (currentVotes + 1)).toFixed(1);
  
      // Update the food popularity
      const popularityResponse = await axiosInstance.put(
        `/food/update-popularity/${food_id}`,
        {
          rating: parseFloat(newCalculatedRating),
          existing_vote: false,
        }
      );
      console.log("✅ Food popularity updated successfully:", popularityResponse.data);
      
      // Update parent's rating state if a callback is provided
      if (popularityResponse.data && onRatingUpdate) {
        onRatingUpdate(popularityResponse.data.new_rating, popularityResponse.data.votes);
      }
  
      // Re-fetch all comments to update the list with the new comment
      await fetchComments();

      // Reset the comment form
      setNewComment("");
      setRating(0);
      setHasCommented(true); // ⬅️ Immediately disable further commenting
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        setError(`Failed to submit comment: ${error.response.data.detail || "Please try again"}`);
      } else {
        setError("Failed to submit comment. Please try again.");
      }
    }
  };

  const translateComment = async (uniqueKey, text) => {
    setTranslating((prev) => ({ ...prev, [uniqueKey]: true }));
    try {
      const targetLanguage = i18n.language;
      const response = await axiosInstance.post("/translation/", {
        text: text,
        target_lang: targetLanguage,
      });
      setTranslatedComments((prev) => ({
        ...prev,
        [uniqueKey]: response.data.translated_text,
      }));
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedComments((prev) => ({
        ...prev,
        [uniqueKey]: `${t("translationError")}`,
      }));
    } finally {
      setTranslating((prev) => ({ ...prev, [uniqueKey]: false }));
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto", padding: "10px" }}>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : comments.length === 0 ? (
        <Typography color="red">{t("noComments")}</Typography>
      ) : (
        <List>
          {comments.map((comment, index) => {
            const uniqueKey = `${comment.id}-${index}`;
            return (
              <Card
                key={uniqueKey}
                sx={{
                  marginBottom: 1,
                  padding: 1,
                  borderRadius: "12px",
                  maxWidth: "100%",
                  display: "block",
                  minHeight: "60px",
                  boxShadow: 1,
                }}
              >
                <CardContent>
                  <ListItem alignItems="flex-start" sx={{ alignItems: "center" }}>
                    <ListItemAvatar>
                      <IconButton onClick={() => navigate(`/profile/${comment.userName}`)}>
                        <Avatar src={`/avatars/${comment.userAvatar}.png`} alt={comment.userName} />
                      </IconButton>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                {comment.userName}
                              </Typography>
                              <Rating
                                name="read-only"
                                value={comment.rate || 0}
                                readOnly
                                precision={0.5}
                                sx={{
                                  marginBottom: "10px",
                                  "& .MuiRating-iconFilled": { color: "#FFD700" },
                                  "& .MuiRating-iconEmpty": { color: "#C0C0C0" },
                                }}
                              />
                            </Box>
                            <Tooltip title={t("translate")}>
                              <IconButton
                                onClick={() => translateComment(uniqueKey, comment.comment)}
                                sx={{
                                  width: "30px",
                                  height: "30px",
                                  padding: "2px",
                                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)", transform: "none" },
                                }}
                                disabled={translating[uniqueKey]}
                              >
                                {translating[uniqueKey] ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <TranslateIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </>
                      }
                      secondary={
                        <>
                          <Typography
                            sx={{
                              wordWrap: "break-word",
                              marginTop: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {comment.comment}
                          </Typography>
                          {translatedComments[uniqueKey] && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                {t("translated")}:
                              </Typography>
                              <Typography sx={{ fontSize: "14px" }}>
                                {translatedComments[uniqueKey]}
                              </Typography>
                            </Box>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                </CardContent>
              </Card>
            );
          })}
        </List>
      )}

      {/* Add Comment Section */}
      {hasCommented ? (
        <Box sx={{ mt: 2, p: 2, border: "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#fefefe" }}>
          <Typography variant="body1" color="textPrimary" fontWeight="medium">
            {t("alreadyCommentedMessage") || "You’ve already commented on this food."}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {t("editFromProfile") || "If you'd like to update or delete your comment, please visit your profile."}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => navigate(`/profile/${userData?.username || ""}`)}
          >
            {t("goToProfile") || "Go to Profile"}
          </Button>
        </Box>
      ) : (
        <Box sx={{ marginTop: "10px" }}>
          <Typography variant="h6">{t("leaveComment")}</Typography>
          <StarRating value={rating} onChange={setRating} />
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t("writeComment")}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ marginTop: "5px" }}
          />
          <Button
            variant="contained"
            sx={{ marginTop: "5px", backgroundColor: "#aaa", color: "#fff" }}
            onClick={handleCommentSubmit}
            disabled={!newComment.trim() || rating === 0}
          >
            {t("submit")}
          </Button>
        </Box>
      )}

      {/* Login Popup for users not logged in */}
      <LoginPopup
        open={loginPopupOpen}
        onClose={() => setLoginPopupOpen(false)}
        onLogin={() => {
          setLoginPopupOpen(false);
          navigate("/login");
        }}
        messageKey="toComment"
      />
    </Box>
  );
};

export default Comments;
