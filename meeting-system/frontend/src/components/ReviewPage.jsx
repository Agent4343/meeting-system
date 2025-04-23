import { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  TextField, 
  Card, 
  CardContent,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Grid,
  Chip,
  Switch,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

function ReviewPage() {
  const navigate = useNavigate();
  const { currentMeeting } = useAppContext();
  const [isolations, setIsolations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saveProgress, setSaveProgress] = useState(false);
  // const [relatedIsolations, setRelatedIsolations] = useState([]); // Removed duplicate declaration

  // Function to check for related isolations based ONLY on the first 3 digits after CAHE-
  const checkForRelatedIsolations = (isolations, currentIsolation) => {
    const currentEquipmentString = currentIsolation?.systemEquipment || currentIsolation?.['System/Equipment']; // Check both properties
    if (!currentIsolation || !currentEquipmentString) {
      return [];
    }
    
    // Extract the first 3 digits after CAHE- from the current isolation
    const currentMatch = currentEquipmentString.match(/CAHE[-]?(\d{3})/i);
    if (!currentMatch || !currentMatch[1]) {
      return [];
    }
    const currentPrefix = currentMatch[1];
    
    // Find other isolations with the same first 3 digits
    const related = isolations.filter(isolation => {
      if (isolation.id === currentIsolation.id) return false;
      const equipmentString = isolation.systemEquipment || isolation['System/Equipment']; // Check both properties
      if (!equipmentString) return false;
      
      const isolationMatch = equipmentString.match(/CAHE[-]?(\d{3})/i);
      if (!isolationMatch || !isolationMatch[1]) return false;
      
      const isolationPrefix = isolationMatch[1];
      
      // Return true if the first 3 digits match
      return isolationPrefix === currentPrefix;
    });
    return related;
  };
  
  // State to store previous meeting responses
  const [previousResponses, setPreviousResponses] = useState({});
  const [showPreviousResponses, setShowPreviousResponses] = useState(true);

  useEffect(() => {
    // Load isolations from localStorage
    const data = JSON.parse(localStorage.getItem('currentMeetingIsolations')) || [];
    if (data.length === 0) navigate('/setup');
    setIsolations(data);
    
    // Load any saved responses from current meeting
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};
    setResponses(savedResponses);
    
    // Load previous meeting responses
    const prevResponses = JSON.parse(localStorage.getItem('previousMeetingResponses')) || {};
    setPreviousResponses(prevResponses);
    
    // If there are saved responses, ask if the user wants to continue from where they left off
    if (Object.keys(savedResponses).length > 0) {
      // Find the last isolation that has a response
      const lastRespondedIndex = data.findIndex(isolation => 
        !savedResponses[isolation.id] || !isIsolationComplete(savedResponses[isolation.id])
      );
      
      if (lastRespondedIndex !== -1) {
        setCurrentIndex(lastRespondedIndex);
      }
    }
  }, [navigate]);
  
  // State to store related isolations (based on 3-digit prefix)
  const [relatedIsolations, setRelatedIsolations] = useState([]); // Keep this one
  
  // Check for related isolations when current isolation changes
  useEffect(() => {
    if (currentIsolation) {
      const related = checkForRelatedIsolations(isolations, currentIsolation);
      setRelatedIsolations(related);
      
      // Optionally, set risk to Medium if related isolations are found and risk isn't already set
      // Note: Removed auto-setting to High based on exact match, as per user feedback
      // if (related.length > 0 && !responses[currentIsolation.id]?.risk) {
      //   setResponses(prev => ({
      //     ...prev,
      //     [currentIsolation.id]: {
      //       ...(prev[currentIsolation.id] || {}),
      //       risk: 'Medium', // Or keep as is and let user decide
      //       additionalRiskReason: 'Related isolations on same system (same first 3 digits)'
      //     }
      //   }));
      // }
    }
  }, [currentIndex, isolations]); // Removed responses dependency as we're not auto-setting risk anymore
  
  // Check if an isolation response is complete
  const isIsolationComplete = (response) => {
    if (!response) return false;
    
    // Check if risk is selected
    if (!response.risk) return false;
    
    // If risk is Medium or High, check if mitigation is provided
    if (['Medium', 'High'].includes(response.risk) && !response.mitigation) return false;
    
    // Check if partsRequired is selected
    if (!response.partsRequired) return false;
    
    // If parts are required, check if arrival date is provided
    if (response.partsRequired === 'Yes' && !response.partsArrival) return false;
    
    // Check if MOC is selected
    if (!response.mocRequired) return false;
    
    // If MOC is required, check if MOC number and comments are provided
    if (response.mocRequired === 'Yes' && (!response.mocNumber || !response.mocComments)) return false;
    
    // Check if engineering support is selected
    if (!response.engineeringSupport) return false;
    
    // If engineering support is required, check if engineer name and ETA are provided
    if (response.engineeringSupport === 'Yes' && (!response.engineerName || !response.engineerETA)) return false;
    
    return true;
  };
  
  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (isolations.length === 0) return 0;
    
    const completedCount = isolations.filter(isolation => 
      responses[isolation.id] && isIsolationComplete(responses[isolation.id])
    ).length;
    
    return Math.round((completedCount / isolations.length) * 100);
  };

  const currentIsolation = isolations[currentIndex];

  const handleChange = (field, value) => {
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setResponses(prev => ({
      ...prev,
      [currentIsolation.id]: {
        ...prev[currentIsolation.id],
        [field]: value,
      },
    }));
    
    // Save progress to localStorage
    if (saveProgress) {
      const updatedResponses = {
        ...responses,
        [currentIsolation.id]: {
          ...(responses[currentIsolation.id] || {}),
          [field]: value,
        },
      };
      localStorage.setItem('currentMeetingResponses', JSON.stringify(updatedResponses));
    }
  };

  const validateCurrentIsolation = () => {
    const response = responses[currentIsolation.id] || {};
    const errors = {};
    
    // Validate risk
    if (!response.risk) {
      errors.risk = 'Please select a risk level';
    }
    
    // If risk is Medium or High, validate mitigation
    if (['Medium', 'High'].includes(response.risk) && !response.mitigation) {
      errors.mitigation = 'Please provide a risk mitigation plan';
    }
    
    // Validate parts required
    if (!response.partsRequired) {
      errors.partsRequired = 'Please indicate if parts are required';
    }
    
    // If parts are required, validate arrival date
    if (response.partsRequired === 'Yes' && !response.partsArrival) {
      errors.partsArrival = 'Please provide an estimated arrival date';
    }
    
    // Validate MOC required
    if (!response.mocRequired) {
      errors.mocRequired = 'Please indicate if MOC is required';
    }
    
    // If MOC is required, validate MOC number and comments
    if (response.mocRequired === 'Yes') {
      if (!response.mocNumber) {
        errors.mocNumber = 'Please provide a MOC number';
      }
      if (!response.mocComments) {
        errors.mocComments = 'Please provide MOC comments';
      }
    }
    
    // Validate engineering support
    if (!response.engineeringSupport) {
      errors.engineeringSupport = 'Please indicate if engineering support is required';
    }
    
    // If engineering support is required, validate engineer name and ETA
    if (response.engineeringSupport === 'Yes') {
      if (!response.engineerName) {
        errors.engineerName = 'Please provide an engineer name';
      }
      if (!response.engineerETA) {
        errors.engineerETA = 'Please provide an engineer ETA';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const previous = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setValidationErrors({});
    }
  };

  const next = () => {
    // Save current responses to localStorage
    localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
    
    if (currentIndex < isolations.length - 1) {
      // Validate current isolation before moving to next
      if (validateCurrentIsolation()) {
        setCurrentIndex(currentIndex + 1);
        setValidationErrors({});
      } else {
        setSnackbar({
          open: true,
          message: 'Please complete all required fields before proceeding',
          severity: 'error'
        });
      }
    } else {
      // Check if all isolations have been reviewed
      const allComplete = isolations.every(isolation => 
        responses[isolation.id] && isIsolationComplete(responses[isolation.id])
      );
      
      if (allComplete) {
        setConfirmDialog(true);
      } else {
        setSnackbar({
          open: true,
          message: 'Please complete all isolation reviews before finishing',
          severity: 'warning'
        });
      }
    }
  };
  
  const finishReview = () => {
    localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
    setConfirmDialog(false);
    navigate('/summary');
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const toggleSaveProgress = () => {
    setSaveProgress(!saveProgress);
    if (!saveProgress) {
      // Save current progress when enabling auto-save
      localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
      setSnackbar({
        open: true,
        message: 'Auto-save enabled. Progress will be saved as you go.',
        severity: 'info'
      });
    }
  };

  if (!currentIsolation) return null;

  const completionPercentage = getCompletionPercentage();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 2, mt: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => navigate('/setup')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Review Isolations</Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={showPreviousResponses} 
                  onChange={(e) => setShowPreviousResponses(e.target.checked)} 
                />
              }
              label="Show Previous Responses"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={saveProgress} 
                  onChange={toggleSaveProgress} 
                />
              }
              label="Auto-save"
            />
            <Tooltip title="Save progress automatically as you review">
              <IconButton>
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Overall Progress</Typography>
            <Typography variant="body1">{completionPercentage}% Complete</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Isolation {currentIndex + 1} of {isolations.length}
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<NavigateBeforeIcon />} 
              onClick={previous}
              disabled={currentIndex === 0}
              sx={{ mr: 1 }}
            >
              Previous
            </Button>
            <Button 
              variant="contained" 
              endIcon={<NavigateNextIcon />} 
              onClick={next}
            >
              {currentIndex === isolations.length - 1 ? 'Finish Review' : 'Next'}
            </Button>
          </Box>
        </Box>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {currentIsolation.Title || `Isolation ID: ${currentIsolation.id}`}
              </Typography>
              
              {responses[currentIsolation.id] && isIsolationComplete(responses[currentIsolation.id]) ? (
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Complete" 
                  color="success" 
                  variant="outlined" 
                />
              ) : (
                <Chip 
                  icon={<ErrorIcon />} 
                  label="Incomplete" 
                  color="warning" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Related by prefix (first 3 digits) - Warning */}
            {relatedIsolations.length > 0 && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle2">
                  Warning: Related Isolations Detected
                </Typography>
                <Typography variant="body2">
                  This isolation shares the same system prefix (first 3 digits after CAHE-) with {relatedIsolations.length} other isolation(s). 
                  This may indicate related equipment and potential additional risks that need consideration.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {relatedIsolations.map(isolation => (
                    <Chip 
                      key={isolation.id}
                      label={isolation.Title || isolation.id}
                      size="small"
                      color="warning"
                      sx={{ mr: 1, mt: 1 }}
                    />
                  ))}
                </Box>
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Risk Level:</Typography>
                <RadioGroup
                  row
                  value={responses[currentIsolation.id]?.risk || ''}
                  onChange={(e) => handleChange('risk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio />} label="High" />
                </RadioGroup>
                {validationErrors.risk && (
                  <Alert severity="error" sx={{ mt: 1 }}>{validationErrors.risk}</Alert>
                )}
              </Grid>
              
              {['Medium', 'High'].includes(responses[currentIsolation.id]?.risk) && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Risk Mitigation Plan"
                    value={responses[currentIsolation.id]?.mitigation || ''}
                    onChange={(e) => handleChange('mitigation', e.target.value)}
                    error={!!validationErrors.mitigation}
                    helperText={validationErrors.mitigation}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Parts Required?</Typography>
                <RadioGroup
                  row
                  value={responses[currentIsolation.id]?.partsRequired || ''}
                  onChange={(e) => handleChange('partsRequired', e.target.value)}
                >
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                </RadioGroup>
                {validationErrors.partsRequired && (
                  <Alert severity="error" sx={{ mt: 1 }}>{validationErrors.partsRequired}</Alert>
                )}
              </Grid>
              
              {responses[currentIsolation.id]?.partsRequired === 'Yes' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Parts Arrival Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={responses[currentIsolation.id]?.partsArrival || ''}
                    onChange={(e) => handleChange('partsArrival', e.target.value)}
                    error={!!validationErrors.partsArrival}
                    helperText={validationErrors.partsArrival}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>MOC Required?</Typography>
                <RadioGroup
                  row
                  value={responses[currentIsolation.id]?.mocRequired || ''}
                  onChange={(e) => handleChange('mocRequired', e.target.value)}
                >
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                </RadioGroup>
                {validationErrors.mocRequired && (
                  <Alert severity="error" sx={{ mt: 1 }}>{validationErrors.mocRequired}</Alert>
                )}
              </Grid>
              
              {responses[currentIsolation.id]?.mocRequired === 'Yes' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="MOC Number"
                      value={responses[currentIsolation.id]?.mocNumber || ''}
                      onChange={(e) => handleChange('mocNumber', e.target.value)}
                      error={!!validationErrors.mocNumber}
                      helperText={validationErrors.mocNumber}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="MOC Comments"
                      value={responses[currentIsolation.id]?.mocComments || ''}
                      onChange={(e) => handleChange('mocComments', e.target.value)}
                      error={!!validationErrors.mocComments}
                      helperText={validationErrors.mocComments}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Engineering Support Required?</Typography>
                <RadioGroup
                  row
                  value={responses[currentIsolation.id]?.engineeringSupport || ''}
                  onChange={(e) => handleChange('engineeringSupport', e.target.value)}
                >
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                </RadioGroup>
                {validationErrors.engineeringSupport && (
                  <Alert severity="error" sx={{ mt: 1 }}>{validationErrors.engineeringSupport}</Alert>
                )}
              </Grid>
              
              {responses[currentIsolation.id]?.engineeringSupport === 'Yes' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Engineer Name"
                      value={responses[currentIsolation.id]?.engineerName || ''}
                      onChange={(e) => handleChange('engineerName', e.target.value)}
                      error={!!validationErrors.engineerName}
                      helperText={validationErrors.engineerName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Engineer ETA"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={responses[currentIsolation.id]?.engineerETA || ''}
                      onChange={(e) => handleChange('engineerETA', e.target.value)}
                      error={!!validationErrors.engineerETA}
                      helperText={validationErrors.engineerETA}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Comments:</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add any comments or notes about this isolation. These comments will be saved and carried over to future meetings."
                  value={responses[currentIsolation.id]?.comments || ''}
                  onChange={(e) => handleChange('comments', e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Previous Meeting Responses Card */}
        {showPreviousResponses && previousResponses[currentIsolation.id] && (
          <Card sx={{ mb: 4, bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Previous Meeting Responses for Isolation: {currentIsolation.id}
              </Typography>
              {currentIsolation.Title && (
                <Typography variant="subtitle1" gutterBottom color="primary.dark">
                  {currentIsolation.Title}
                </Typography>
              )}
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                From meeting on: {previousResponses[currentIsolation.id].lastReviewed || 'Unknown date'}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Risk Level:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].risk || 'Not specified'}
                  </Typography>
                </Grid>
                
                {['Medium', 'High'].includes(previousResponses[currentIsolation.id]?.risk) && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Risk Mitigation:</Typography>
                    <Typography variant="body1">
                      {previousResponses[currentIsolation.id].mitigation || 'Not specified'}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Parts Required:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].partsRequired || 'Not specified'}
                  </Typography>
                </Grid>
                
                {previousResponses[currentIsolation.id]?.partsRequired === 'Yes' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Parts Arrival Date:</Typography>
                    <Typography variant="body1">
                      {previousResponses[currentIsolation.id].partsArrival || 'Not specified'}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>MOC Required:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].mocRequired || 'Not specified'}
                  </Typography>
                </Grid>
                
                {previousResponses[currentIsolation.id]?.mocRequired === 'Yes' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>MOC Number:</Typography>
                      <Typography variant="body1">
                        {previousResponses[currentIsolation.id].mocNumber || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>MOC Comments:</Typography>
                      <Typography variant="body1">
                        {previousResponses[currentIsolation.id].mocComments || 'Not specified'}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Engineering Support Required:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].engineeringSupport || 'Not specified'}
                  </Typography>
                </Grid>
                
                {previousResponses[currentIsolation.id]?.engineeringSupport === 'Yes' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Engineer Name:</Typography>
                      <Typography variant="body1">
                        {previousResponses[currentIsolation.id].engineerName || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Engineer ETA:</Typography>
                      <Typography variant="body1">
                        {previousResponses[currentIsolation.id].engineerETA || 'Not specified'}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Comments:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].comments || 'No comments from previous meeting'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Last Reviewed:</Typography>
                  <Typography variant="body1">
                    {previousResponses[currentIsolation.id].lastReviewed || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => {
                    // Copy previous responses to current responses
                    setResponses(prev => ({
                      ...prev,
                      [currentIsolation.id]: {
                        ...previousResponses[currentIsolation.id],
                        lastReviewed: new Date().toISOString().split('T')[0]
                      }
                    }));
                    
                    setSnackbar({
                      open: true,
                      message: 'Previous responses copied to current review',
                      severity: 'success'
                    });
                  }}
                >
                  Use Previous Responses
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            startIcon={<NavigateBeforeIcon />} 
            onClick={previous}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          <Box>
            <Tooltip title={previousResponses[currentIsolation.id] ? 
              "Mark as reviewed with no changes from previous meeting" : 
              "This option is only available for isolations that have been reviewed in a previous meeting"}>
              <span>
                <Button 
                  variant="outlined"
                  color="success"
                  sx={{ mr: 2 }}
                  disabled={!previousResponses[currentIsolation.id]}
                  onClick={() => {
                // Mark current isolation as reviewed with no changes
                // But preserve any comments from the previous meeting
                const defaultValues = {
                  risk: 'Low',
                  partsRequired: 'No',
                  mocRequired: 'No',
                  engineeringSupport: 'No',
                  noChanges: true,
                  comments: previousResponses[currentIsolation.id]?.comments || ''
                };
                
                setResponses(prev => ({
                  ...prev,
                  [currentIsolation.id]: {
                    ...defaultValues,
                    lastReviewed: new Date().toISOString().split('T')[0]
                  }
                }));
                
                // Save to localStorage
                const updatedResponses = {
                  ...responses,
                  [currentIsolation.id]: {
                    ...defaultValues,
                    lastReviewed: new Date().toISOString().split('T')[0]
                  }
                };
                localStorage.setItem('currentMeetingResponses', JSON.stringify(updatedResponses));
                
                // Show success message
                setSnackbar({
                  open: true,
                  message: 'Isolation marked as reviewed with no changes',
                  severity: 'success'
                });
                
                // Move to next isolation if not the last one
                if (currentIndex < isolations.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setValidationErrors({});
                }
              }}
            >
              No Changes
            </Button>
              </span>
            </Tooltip>
            
            <Button 
              variant="contained" 
              endIcon={<NavigateNextIcon />} 
              onClick={next}
              color={currentIndex === isolations.length - 1 ? "success" : "primary"}
            >
              {currentIndex === isolations.length - 1 ? 'Finish Review' : 'Next Isolation'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Finish Review?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have completed the review of all {isolations.length} isolations.
            Would you like to proceed to the meeting summary?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={finishReview} variant="contained" color="primary">
            Proceed to Summary
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ReviewPage;
