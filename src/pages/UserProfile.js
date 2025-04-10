// UserProfile.js
import React, { useEffect, useState } from 'react';  
import { Box, Stack, Typography, Paper, Chip, IconButton } from '@mui/material';
import { useTranslation } from "react-i18next";
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
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000'; 

//const USER_ID = localStorage.getItem("user"); 
const accessToken = localStorage.getItem("accessToken"); 
console.log("access token: ", accessToken);


const UserProfile = () => {
  const { USERNAME } = useParams();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [ratedFoodDetails, setRatedFoodDetails] = useState([]);
  const [favoriteFoodDetails, setFavoriteFoodDetails] = useState([]);
  const [editingDisliked, setEditingDisliked] = useState(false);
  const [editedDislikedIngredients, setEditedDislikedIngredients] = useState([]);
  const [dislikedIngredients, setDislikedIngredients] = useState([]);
  const [editingBio, setEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editedAllergies, setEditedAllergies] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [showAllergyInput, setShowAllergyInput] = useState(false);
  const [showDislikedInput, setShowDislikedInput] = useState(false);


  const { t, i18n } = useTranslation("global");

  const getAvatarSrc = (avatarId) => {
    if (typeof avatarId !== 'string' || avatarId.trim() === '') {
      return '/avatars/default-profile.jpeg';
    }
    return avatarId.includes('.png')
      ? `/avatars/${avatarId}`
      : `/avatars/${avatarId}.png`;
  };

  useEffect(() => {
    axiosInstance.get('/auth/users/me')
      .then(response => {
        const user = response.data.data[0];
        setCurrentUser(user);

        // Check if we’re viewing our own profile or someone else’s
        if (USERNAME === user.username) {
          setIsOwnProfile(true);
          setUserData(user);
          setEditedBio(user.bio || "");
          console.log("user: ", user);

          const rawDisliked = user?.disliked_ingredients || "";
          console.log("raw disliked: ", rawDisliked);
          const parsedDisliked = Array.isArray(user?.disliked_ingredients)
            ? user.disliked_ingredients
            : [];

          setEditedDislikedIngredients(parsedDisliked);
          setDislikedIngredients(parsedDisliked);
          console.log("edited disliked ingredients: ", editedDislikedIngredients);

          const allergiesResponse = await axios.get(`${API_BASE_URL}/users/allergies/${user.username}`);
          const allergyData = allergiesResponse.data.data;
          const parsedAllergies = Array.isArray(allergyData) ? allergyData.flat() : [];
          setAllergies(parsedAllergies);
          setEditedAllergies(parsedAllergies);
          console.log("allergies: ", allergiesResponse.data.data);

          // Get current user's comments/ratings
          return axios.get(`${API_BASE_URL}/comments/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
        } else {
          // Get the requested user's profile
          return axiosInstance.get(`/users/${USERNAME}`)
            .then(userResponse => {
              const profileUser = userResponse.data.data[0];
              setUserData(profileUser);
              setEditedBio(profileUser.bio || "");

              const rawDisliked = profileUser?.disliked_ingredients || "";
              console.log("raw disliked: ", rawDisliked);
              const parsedDisliked = Array.isArray(profileUser?.disliked_ingredients)
                ? profileUser.disliked_ingredients
                : [];
              setEditedDislikedIngredients(parsedDisliked);
              setDislikedIngredients(parsedDisliked);
              console.log("edited disliked ingredients: ", editedDislikedIngredients);

              const allergiesResponse = await axios.get(`${API_BASE_URL}/users/allergies/${USERNAME}`);
              const allergyData = allergiesResponse.data.data;
              const parsedAllergies = Array.isArray(allergyData) ? allergyData.flat() : [];
              setAllergies(parsedAllergies);
              setEditedAllergies(parsedAllergies);
              console.log("allergies: ", allergiesResponse.data.data);

              // Get the requested user's comments/ratings
              return axiosInstance.get(`/comments/${USERNAME}/comments`);
            });
        }
      })
      .then(response => {
        const ratedFoods = response.data.map(comment => ({
          foodId: comment.foodId,
          rate: comment.rate, 
          comment: comment.comment,
        }));

        const foodRequests = ratedFoods.map(food =>
          axiosInstance.get(`/food/${food.foodId}`)
            .then(res => ({
              ...food,
              ...res.data,
            }))
        );
        return Promise.all(foodRequests);
      })
      .then(updatedRatedFoods => {
        setRatedFoodDetails(updatedRatedFoods);
        setFavoriteFoodDetails(updatedRatedFoods.filter(food => food.rate === 5));
      })
      .catch(error => console.error('Error fetching user data:', error));
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
      
      setFavoriteFoodDetails(prev => {
        if (newRate === 5) {
          const updatedFood = ratedFoodDetails.find(food => food.foodId === foodId);
          if (updatedFood) {
            return [...prev, {
              ...updatedFood,
              rate: 5,
              popularity: { ...updatedFood.popularity, rating: parseFloat(newCalculatedRating) }
            }];
          }
        } else {
          return prev.filter(food => food.foodId !== foodId);
        }
        return prev;
      });
    } catch (error) {
      console.error('Error updating rating or popularity:', error);
      // Revert UI changes on error
      setRatedFoodDetails(prev => prev.map(food =>
        food.foodId === foodId
          ? { ...food, rate: oldRate, popularity: { ...food.popularity, rating: oldRating } }
          : food
      ));
      setFavoriteFoodDetails(prev => prev.filter(favFood => favFood.foodId !== foodId));
    }

    if (newRate < 5) {
      setFavoriteFoodDetails(prev => prev.filter(favFood => favFood.foodId !== foodId));
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

  const displayedDislikedIngredients = editingDisliked ? editedDislikedIngredients : dislikedIngredients;

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
          Authorization: `Bearer ${accessToken}`
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

  const getLocalizedIngredient = (enName) => {
    const found = ingredientsList.find((item) => item.en === enName);
    return found ? (i18n.language === "tr" ? found.tr : found.en) : enName;
  };

  console.log("displayedDislikedIngredients: ", displayedDislikedIngredients)
  console.log("editingDisliked: ", editingDisliked)
  console.log("editedDislikedIngredients: ", editedDislikedIngredients)

  if (!userData) return <Typography>{t("loading")}</Typography>;

  return (
    <>
      <Header />
      <Box padding={4} bgcolor="white">
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 4, position: 'relative' }}>
          <Box display="flex" alignItems="center" marginBottom={3} gap={2}>
            {isOwnProfile ? (
              <ProfilePictureSelector
                currentAvatar={userData.avatarId || ''} // ensures an empty string is passed
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
            
            <Box sx={{ paddingLeft: 1 }}>
              <Typography variant="h5">{userData.username || 'Anonymous User'}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {userData.email || 'No email available.'}
              </Typography>
              <Box display="flex" alignItems="right" justifyContent="space-between" gap={1}>
                {isOwnProfile && editingBio ? (
                  <>
                    <input
                      type="text"
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "4px 8px",
                        fontSize: "1rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }}
                    />
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
                  <>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {userData.bio || t("noBio")}
                    </Typography>
                    {isOwnProfile && (
                      <IconButton
                        onClick={() => setEditingBio(true)}
                        size="small"
                        sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {displayedDislikedIngredients.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: "bold", color: "gray" }}>
                {t("dislikedIngredients")}
              </Typography>
              {isOwnProfile && (
                editingDisliked ? (
                  <Box>
                    <IconButton
                      onClick={handleSaveEditedIngredients}
                      size="small"
                      sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={handleCancelEditedIngredients}
                      size="small"
                      sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                    >
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
                    sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {displayedDislikedIngredients.map((ingredient, index) => (
                <Chip
                  key={index}
                  label={getLocalizedIngredient(ingredient)}
                  {...(editingDisliked ? { onDelete: () => handleRemoveIngredient(ingredient) } : {})}
                  sx={{ backgroundColor: "#f1f1f1", fontWeight: "bold", fontSize: "14px", py: 0.5, px: 1 }}
                />
              ))}

              {/* Autocomplete input appears here */}
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

              {/* ➕ Add button only if input is not visible */}
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

          {(editingAllergies ? editedAllergies.length > 0 : allergies.length > 0 || editingAllergies) && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: "bold", color: "gray" }}>
                  {t("allergies")}
                </Typography>
                {editingAllergies ? (
                  <Box>
                    <IconButton 
                      onClick={handleSaveEditedAllergies}
                      size="small"
                      sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={handleCancelEditedAllergies}
                      size="small"
                      sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                    >
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
                    sx={{ p: 0.25, minWidth: 0, width: "20px", height: "20px" }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {(editingAllergies ? editedAllergies : allergies).map((allergy, index) => (
                  <Chip 
                    key={index} 
                    label={getLocalizedIngredient(allergy)}
                    {...(editingAllergies ? { onDelete: () => handleRemoveAllergy(allergy) } : {})}
                    sx={{ backgroundColor: "#ffe5e5", fontWeight: "bold", fontSize: "14px", py: 0.5, px: 1 }}
                  />
                ))}

                {/* Autocomplete input appears here */}
                {editingAllergies && showAllergyInput && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <AddIngredientAutocomplete
                      onAdd={(newAllergy) => {
                        if (!editedAllergies.includes(newAllergy)) {
                          setEditedAllergies((prev) => [...prev, newAllergy].flat()); // flatten
                          setShowAllergyInput(false);
                        }
                      }}
                    />
                  </Box>
                )}

                {/* ➕ Add button only if input is not visible */}
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
            <Box display="flex" flexDirection="column" gap={2}>
              {ratedFoodDetails.map((ratedFood, index) => (
                <FoodInProfile 
                  key={index} 
                  food={ratedFood} 
                  onRateChange={handleRateChange}
                  readOnly={!isOwnProfile} 
                  ingredientsList={ingredientsList}

                />
              ))}
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ flex: 1, padding: 3 }}>                        
            <Typography variant="h6" marginBottom={2}>
              {t("favoriteFoods")}
            </Typography>
            {favoriteFoodDetails.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {favoriteFoodDetails.map((food, index) => (
                  <FoodInProfile
                    key={index}
                    food={food}
                    onRateChange={handleRateChange}
                    readOnly={!isOwnProfile}
                    ingredientsList={ingredientsList}
                />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                {t("noFavoriteFoods")}
              </Typography>            
            )}
          </Paper>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default UserProfile;