import React, { useEffect, useState } from 'react';  
import { Box, Stack, Typography, Paper, Chip, IconButton } from '@mui/material';
import { useTranslation } from "react-i18next";
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from "@mui/icons-material/Add";
import FoodInProfile from '../components/FoodInProfile';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfilePictureSelector from '../components/ProfilePictureSelector';
import AddIngredientAutocomplete from "../components/AddIngredientAutocomplete";
import axiosInstance from '../axiosInstance';  // Import the custom axios instance
import styled from "styled-components";
import { useParams } from 'react-router-dom';
import Lottie from "lottie-react";
import loadingAnimation from "../assets/loading_animation.json"; // adjust path if needed
import ConnectionModal from "../components/ConnectionModal";

// Add these styled components to match the Home component's structure
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

const API_BASE_URL = 'http://localhost:8000'; 

const UserProfile = () => {
  const { USERNAME } = useParams();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [ratedFoodDetails, setRatedFoodDetails] = useState([]);
  const [editingDisliked, setEditingDisliked] = useState(false);
  const [editedDislikedIngredients, setEditedDislikedIngredients] = useState([]);
  const [dislikedIngredients, setDislikedIngredients] = useState([]);
  const [editingBio, setEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editedAllergies, setEditedAllergies] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [showAllergyInput, setShowAllergyInput] = useState(false);
  const [showDislikedInput, setShowDislikedInput] = useState(false);
  const [wannaTryFoods, setWannaTryFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionCount, setConnectionCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null); // "accepted", "pending", or null
  const [connectedUsernames, setConnectedUsernames] = useState([]);
  const [showConnectionList, setShowConnectionList] = useState(false);
  const [showAcceptRejectButtons, setShowAcceptRejectButtons] = useState(false);
  const [pendingConnectionId, setPendingConnectionId] = useState(null);

  const { t, i18n } = useTranslation("global");

  const getAvatarSrc = (avatarId) => {
    if (typeof avatarId !== 'string' || avatarId.trim() === '') {
      return `/avatars/default-profile.jpeg`;
    }
    return avatarId.includes('.png')
      ? `/avatars/${avatarId}`
      : `/avatars/${avatarId}.png`;
  };

  const fetchConnectionList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/connections/list/${userData.username}`);
      setConnectedUsernames(res.data.connected_usernames || []);
      setShowConnectionList(true);
    } catch (err) {
      console.error("Failed to fetch connected usernames:", err);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get(`/auth/users/me`);
        const user = response.data.data[0];
        setCurrentUser(user);
  
        let profileUser = null;
  
        if (USERNAME === user.username) {
          setIsOwnProfile(true);
          profileUser = user;
        } else {
          setIsOwnProfile(false);
          const userResponse = await axiosInstance.get(`/users/${USERNAME}`);
          profileUser = userResponse.data.data[0];
        }
        console.log("Is Own Profile: ", isOwnProfile);
  
        setUserData(profileUser);
        setEditedBio(profileUser.bio || "");

        // Fetch connection count
        try {
          const countRes = await axios.get(`${API_BASE_URL}/connections/count/${profileUser.username}`);
          setConnectionCount(countRes.data.count || 0);
        } catch (err) {
          console.warn("Couldn't fetch connection count:", err);
        }

        // Check connection status
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/connections/status/${user.username}/${profileUser.username}`);
          console.log("statusRes: ", statusRes)
          setConnectionStatus(statusRes.data.status); // "accepted", "pending", or null
        } catch (err) {
          console.warn("Couldn't fetch connection status:", err);
        }

        // Check if this user has sent a request to me
        try {
          const res = await axiosInstance.get(`/connections/requests/details/${user.username}`);
          const incoming = res.data?.incoming_requests || [];
          
          const matchedRequest = incoming.find((req) => req.from_username === profileUser.username);
        
          if (matchedRequest) {
            setShowAcceptRejectButtons(true);
            setPendingConnectionId(matchedRequest._id); // 💡 Store the connection _id
          } else {
            setShowAcceptRejectButtons(false);
          }
        } catch (err) {
          console.warn("Failed to check incoming requests:", err);
        }
        

        const parsedDisliked = Array.isArray(profileUser?.disliked_ingredients)
          ? profileUser.disliked_ingredients
          : [];
        setEditedDislikedIngredients(parsedDisliked);
        setDislikedIngredients(parsedDisliked);

        if (profileUser?.username) {
          const allergiesResponse = await axios.get(`${API_BASE_URL}/users/allergies/${profileUser.username}`);
          const allergyData = allergiesResponse.data.data;
          const parsedAllergies = Array.isArray(allergyData) ? allergyData.flat() : [];
          setAllergies(parsedAllergies);
          setEditedAllergies(parsedAllergies);
        } else {
          console.warn("⚠️ Username is missing, skipping allergy fetch.");
        }
  
        const token = localStorage.getItem("accessToken");
        // Get comments
        const commentsResponse = USERNAME === user.username
          ? await axios.get(`${API_BASE_URL}/comments/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          : await axiosInstance.get(`/comments/${USERNAME}/comments`);
  
        const ratedFoods = commentsResponse.data.map(comment => ({
          foodId: comment.foodId,
          rate: comment.rate,
          comment: comment.comment,
        }));
  
        const foodRequests = ratedFoods.map(async food => {
          const res = await axiosInstance.get(`/food/${food.foodId}`);
          return { ...food, ...res.data };
        });
  
        const updatedRatedFoods = await Promise.all(foodRequests);
        setRatedFoodDetails(updatedRatedFoods);
        try {
          const surveyRes = await axios.get(`${API_BASE_URL}/survey/user/${profileUser.username}`);
          const wannaTryIds = surveyRes.data.wannaTry || [];
        
          // Fetch food data for each ID
          const wannaTryFoodRequests = wannaTryIds.map(async (foodId) => {
            const res = await axiosInstance.get(`/food/${foodId}`);
            return { foodId, ...res.data };
          });
        
          const fetchedWannaTryFoods = await Promise.all(wannaTryFoodRequests);
          setWannaTryFoods(fetchedWannaTryFoods);
        } catch (surveyErr) {
          console.warn("Couldn't fetch wannaTry list:", surveyErr);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [USERNAME]);
  
  useEffect(() => {
    fetch("/ingredients.json")
      .then((res) => res.json())
      .then((data) => setIngredientsList(data))
      .catch((err) => console.error("Failed to load ingredients:", err));
  }, []);

  const handleRateChange = async (foodId, newRate) => {
    if (!isOwnProfile) return;

    const food = ratedFoodDetails.find(f => f.foodId === foodId);
    if (!food) return;

    const oldRate = food.rate;
    const votes = food.popularity?.votes || 0;
    const oldRating = food.popularity?.rating || 0;
    const newCalculatedRating = ((oldRating * votes - oldRate + newRate) / votes).toFixed(1);

    // Optimistic UI update
    setRatedFoodDetails(prev => prev.map(food =>
      food.foodId === foodId
        ? { ...food, rate: newRate, popularity: { ...food.popularity, rating: parseFloat(newCalculatedRating) } }
        : food
    ));

    try {
      // Update rating in backend
      await axiosInstance.put(`/comments/update-rate/${foodId}?rate=${newRate}`, {});
      // Update popularity in backend
      await axiosInstance.put(`/food/update-popularity/${foodId}`, {
        rating: parseFloat(newCalculatedRating),
        existing_vote: true
      });
      
    } catch (error) {
      console.error(`Error updating rating or popularity:`, error);
      // Revert UI changes on error
      setRatedFoodDetails(prev => prev.map(food =>
        food.foodId === foodId
          ? { ...food, rate: oldRate, popularity: { ...food.popularity, rating: oldRating } }
          : food
      ));
    }
  };

  useEffect(() => {
    console.log("🩺 editedAllergies now:", editedAllergies);
  }, [editedAllergies]);
  
  // Handler to remove an ingredient from the temporary list.
  const handleRemoveIngredient = (ingredientToRemove) => {
    if (!isOwnProfile) return;
    setEditedDislikedIngredients(prev => prev.filter(ing => ing !== ingredientToRemove));
  };

  const handleSaveEditedIngredients = () => {
    if (!isOwnProfile) return;
    
    axiosInstance.put(`/users/update-disliked-by-username/${userData.username}`, 
      { dislikedIngredients: editedDislikedIngredients },
      {}
    )
    .then(() => {
      setUserData(prev => ({ ...prev, dislikedIngredients: editedDislikedIngredients }));
      setEditingDisliked(false);
      setDislikedIngredients(editedDislikedIngredients);
    })
    .catch(error => console.error('Error updating disliked ingredients:', error));
  };

  const handleCancelEditedIngredients = () => {
    setEditedDislikedIngredients(dislikedIngredients);
    setEditingDisliked(false);
  };

  const displayedDislikedIngredients = isOwnProfile
    ? (editingDisliked ? editedDislikedIngredients : dislikedIngredients)
    : (Array.isArray(userData?.disliked_ingredients) ? userData.disliked_ingredients : []);
  
  console.log("userData: ", userData);
  console.log("userData: ", userData);

    
  const handleSaveEditedBio = () => {
    if (!isOwnProfile) return;
    
    axiosInstance.put(`/users/update-bio-by-username/${userData.username}`, 
      { bio: editedBio },
      {}
    )
    .then(() => {
      setUserData(prev => ({ ...prev, bio: editedBio }));
      setEditingBio(false);
    })
    .catch(error => console.error("Error updating bio:", error));
  };
    
  const handleCancelEditedBio = () => {
    setEditedBio(userData.bio || "");
    setEditingBio(false);
  };

  const handleRemoveAllergy = (allergyToRemove) => {
    setEditedAllergies(prev => prev.filter(ing => ing !== allergyToRemove));
  };
  
  const handleSaveEditedAllergies = () => {
    axios.put(`${API_BASE_URL}/users/update-allergies-by-username/${userData.username}`, 
      { allergies: editedAllergies }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then(() => {
      setUserData(prev => ({ ...prev, allergies: editedAllergies }));
      setAllergies(editedAllergies);
      setEditingAllergies(false);
    })
    .catch(error => console.error("Error updating allergies:", error));
  };
  
  const handleCancelEditedAllergies = () => {
    setEditedAllergies(allergies);
    setEditingAllergies(false);
  }; 

  const token = localStorage.getItem("accessToken");
  const handleCommentUpdate = async (foodId, newComment) => {
    try {
      const commentRes = await axios.get('${API_BASE_URL}/comments/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const comment = commentRes.data.find(c => c.foodId === foodId);
      if (!comment) return;
  
      await axios.put(`${API_BASE_URL}/comments/${comment._id}`, {
        comment: newComment
      });
  
      // ✅ Immediately update local state for UI
      setRatedFoodDetails(prev =>
        prev.map(food =>
          food.foodId === foodId ? { ...food, comment: newComment } : food
        )
      );
  
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };  

  const handleSendConnectionRequest = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/connections/send-request/${currentUser.username}/${userData.username}`
      );
  
      setConnectionStatus("pending"); // Update UI accordingly
    } catch (error) {
      console.error("Failed to send connection request: ", error);
    }
  };

  const handleToggleConnections = async () => {
    if (showConnectionList) {
      setShowConnectionList(false);
    } else {
      await fetchConnectionList();
    }
  };
  
  const handleRemoveConnection = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/connections/remove/${currentUser.username}/${userData.username}`);
      setConnectionStatus(null); // switch UI to "Send Request"
      setConnectionCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to remove connection:", err);
    }
  };
  
  
  const getLocalizedIngredient = (enName) => {
    const found = ingredientsList.find((item) => item.en === enName);
    return found ? (i18n.language === "tr" ? found.tr : found.en) : enName;
  };

  console.log("displayedDislikedIngredients: ", displayedDislikedIngredients)
  console.log("editingDisliked: ", editingDisliked)
  console.log("editedDislikedIngredients: ", editedDislikedIngredients)

  if (loading || !userData) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <Lottie
          animationData={loadingAnimation}
          loop
          style={{ height: 120, width: 120 }}
        />
      </Box>
    );
  }

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <Box padding={4} bgcolor="white">
          <Paper elevation={3} sx={{ padding: 3, marginBottom: 4, position: 'relative' }}>
            <Box display="flex" alignItems="center" marginBottom={3} gap={2}>
              {isOwnProfile ? (
                <ProfilePictureSelector
                  currentAvatar={userData.avatarId || ''}
                  onSelect={(newAvatar) => {
                    axiosInstance.put(`/users/update-avatar-by-username/${userData.username}`, { avatarId: newAvatar })
                      .then(() => {
                        setUserData(prev => ({ ...prev, avatarId: newAvatar }));
                      })
                      .catch(error => console.error('Error updating avatar:', error));
                  }}
                />
              ) : (
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={getAvatarSrc(userData.avatarId)}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              )}
    
              <Box sx={{ paddingLeft: 1, width: '100%' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h5">{userData.username || 'Anonymous User'}</Typography>
                    <Chip
                      clickable
                      label={`${connectionCount} ${t("connections")}`}
                      onClick={() => fetchConnectionList()}
                      sx={{ backgroundColor: "#e0f7fa", fontWeight: "bold" }}
                    />
                    <ConnectionModal
                      open={showConnectionList}
                      onClose={() => setShowConnectionList(false)}
                      usernames={connectedUsernames}
                    />
                  </Box>
    
                  {!isOwnProfile && (
                    connectionStatus === "pending" ? (
                      showAcceptRejectButtons ? (
                        <Box display="flex" gap={1}>
                          <Chip
                            clickable
                            label={t("accept")}
                            onClick={async () => {
                              try {
                                console.log("connection id: ", pendingConnectionId)
                                await axiosInstance.put(`/connections/update-status`, {
                                  connection_id: pendingConnectionId,
                                  status: "accepted"
                                });                              
                                setConnectionStatus("accepted");
                                setConnectionCount(prev => prev + 1);
                                setShowAcceptRejectButtons(false);
                              } catch (err) {
                                console.error("Failed to accept connection:", err);
                              }
                            }}
                            sx={{ backgroundColor: "#c8e6c9", fontWeight: "bold" }}
                          />
                          <Chip
                            clickable
                            label={t("reject")}
                            onClick={async () => {
                              try {
                                await axiosInstance.delete(`/connections/remove-by-id/${pendingConnectionId}`);
                                setConnectionStatus(null);
                                setShowAcceptRejectButtons(false);
                                setPendingConnectionId(null);
                              } catch (err) {
                                console.error("Failed to reject connection:", err);
                              }
                            }}
                            sx={{ backgroundColor: "#ffcdd2", fontWeight: "bold" }}
                          />
                        </Box>
                      ) : (
                        <Chip
                          label={t("requestPending")}
                          sx={{ backgroundColor: "#fff3cd", color: "#856404" }}
                        />
                      )
                    ) : connectionStatus === "accepted" ? (
                      <Chip
                        clickable
                        label={t("removeConnection")}
                        onClick={handleRemoveConnection}
                        sx={{ backgroundColor: "#ffcdd2", fontWeight: "bold" }}
                      />
                    ) : (
                      <Chip
                        clickable
                        label={t("sendConnectionRequest")}
                        onClick={handleSendConnectionRequest}
                        sx={{ backgroundColor: "#c8e6c9", fontWeight: "bold" }}
                      />
                    )
                  )}
                </Box>
    
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {userData.email || 'No email available.'}
                </Typography>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: "gray" }}>
                      {t("bio")}
                    </Typography>
                    {isOwnProfile && editingBio ? (
                      <>
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            onClick={handleSaveEditedBio}
                            size="small"
                            sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={handleCancelEditedBio}
                            size="small"
                            sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    ) : (
                      isOwnProfile && (
                        <IconButton
                          onClick={() => setEditingBio(true)}
                          size="small"
                          sx={{ p: 0.25, width: 20, height: 20 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )
                    )}
                  </Box>

                  {!editingBio ? (
                    <Typography variant="body1" sx={{ color: 'text.primary', maxWidth: '650px' }}>
                      {userData.bio || t("noBio")}
                    </Typography>
                  ) : (
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      rows={2}
                      style={{
                        width: "650px", // increase horizontal size
                        maxWidth: "100%",
                        padding: "8px",
                        fontSize: "1rem",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        resize: "none", // disable resizing
                        lineHeight: "1.4"
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {isOwnProfile && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "gray" }}>
                    {t("dislikedIngredients")}
                  </Typography>
                  {isOwnProfile && (
                    editingDisliked ? (
                      <Box>
                        <IconButton onClick={handleSaveEditedIngredients} size="small" sx={{ p: 0.25, width: 20, height: 20 }}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={handleCancelEditedIngredients} size="small" sx={{ p: 0.25, width: 20, height: 20 }}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton
                        onClick={() => {
                          setEditedDislikedIngredients(dislikedIngredients);
                          setTimeout(() => setEditingDisliked(true), 0);
                        }}
                        size="small"
                        sx={{ p: 0.25, width: 20, height: 20 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )
                  )}
                </Box>

                {!editingDisliked && displayedDislikedIngredients.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'grey.600' }}>
                    {t("noDislikedIngredients")}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {displayedDislikedIngredients.map((ingredient, index) => (
                    <Chip
                      key={index}
                      label={getLocalizedIngredient(ingredient).toLowerCase()}
                      {...(editingDisliked ? { onDelete: () => handleRemoveIngredient(ingredient) } : {})}
                      sx={{ backgroundColor: "#f1f1f1", fontWeight: "bold", fontSize: "14px", py: 0.5, px: 1 }}
                    />
                  ))}

                  {editingDisliked && showDislikedInput && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <AddIngredientAutocomplete
                        onAdd={(newIngredient) => {
                          if (!editedDislikedIngredients.includes(newIngredient)) {
                            setEditedDislikedIngredients((prev) => [...prev, newIngredient].flat());
                            setShowDislikedInput(false);
                          }
                        }}
                      />
                    </Box>
                  )}

                  {editingDisliked && !showDislikedInput && (
                    <IconButton
                      onClick={() => setShowDislikedInput(true)}
                      size="small"
                      sx={{
                        p: 0.25,
                        minWidth: 0,
                        width: "24px",
                        height: "24px",
                        border: "1px dashed #ccc",
                        ml: 0.5,
                        alignSelf: "center"
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            )}


            {isOwnProfile && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "gray" }}>
                    {t("allergies")}
                  </Typography>
                  {editingAllergies ? (
                    <Box>
                      <IconButton onClick={handleSaveEditedAllergies} size="small" sx={{ p: 0.25, width: 20, height: 20 }}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={handleCancelEditedAllergies} size="small" sx={{ p: 0.25, width: 20, height: 20 }}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <IconButton
                      onClick={() => {
                        setEditedAllergies(allergies);
                        setTimeout(() => setEditingAllergies(true), 0);
                      }}
                      size="small"
                      sx={{ p: 0.25, width: 20, height: 20 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {!editingAllergies && allergies.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'grey.600' }}>
                    {t("noAllergies")}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {(editingAllergies ? editedAllergies : allergies).map((allergy, index) => (
                    <Chip
                      key={index}
                      label={getLocalizedIngredient(allergy).toLowerCase()}
                      {...(editingAllergies ? { onDelete: () => handleRemoveAllergy(allergy) } : {})}
                      sx={{ backgroundColor: "#ffe5e5", fontWeight: "bold", fontSize: "14px", py: 0.5, px: 1 }}
                    />
                  ))}

                  {editingAllergies && showAllergyInput && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <AddIngredientAutocomplete
                        onAdd={(newAllergy) => {
                          if (!editedAllergies.includes(newAllergy)) {
                            setEditedAllergies((prev) => [...prev, newAllergy].flat());
                            setShowAllergyInput(false);
                          }
                        }}
                      />
                    </Box>
                  )}

                  {editingAllergies && !showAllergyInput && (
                    <IconButton
                      onClick={() => setShowAllergyInput(true)}
                      size="small"
                      sx={{
                        p: 0.25,
                        minWidth: 0,
                        width: "24px",
                        height: "24px",
                        border: "1px dashed #ccc",
                        ml: 0.5,
                        alignSelf: "center"
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            )}

          </Paper>

          <Box display="flex" justifyContent="space-between" sx={{ gap: 2, width: '100%' }}>
            <Paper elevation={3} sx={{ flex: 1, padding: 3 }}>
              <Typography variant="h6" marginBottom={2}>
                {t("ratedFoods")}
              </Typography>            
              {ratedFoodDetails.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {ratedFoodDetails.map((ratedFood, index) => (
                    <FoodInProfile 
                      key={index} 
                      food={ratedFood} 
                      onRateChange={handleRateChange}
                      readOnly={!isOwnProfile} 
                      ingredientsList={ingredientsList}
                      onCommentUpdate={handleCommentUpdate}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  {t("noRatedFoods")}
                </Typography>
              )}
            </Paper>

            <Paper elevation={3} sx={{ flex: 1, padding: 3 }}>
            <Typography variant="h6" marginBottom={2}>
              {t("wannaTryFoods")}
            </Typography>
              {wannaTryFoods.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {wannaTryFoods.map((food, index) => (
                    <FoodInProfile
                      key={index}
                      food={food}
                      isWannaTry={true}
                      onRemoveFromWannaTry={async (foodIdToRemove) => {
                        try {
                          await axios.delete(`${API_BASE_URL}/survey/remove-from-wanna-try/${userData.username}/${foodIdToRemove}`);
                          setWannaTryFoods(prev => prev.filter(f => f.foodId !== foodIdToRemove));
                        } catch (err) {
                          console.error("Failed to remove from wannaTry:", err);
                        }
                      }}
                      ingredientsList={ingredientsList}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  {t("noWannaTryFoods")}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
        </MainContent>
      <Footer />
    </PageContainer>
  );
};

export default UserProfile;