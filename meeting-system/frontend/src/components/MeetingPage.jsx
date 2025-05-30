import { useState, useEffect } from 'react';
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  Container, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Divider, 
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function MeetingPage() {
  const navigate = useNavigate();
  const [meetingDate, setMeetingDate] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { setCurrentMeeting, people, setPeople } = useAppContext();

  const handleAddExistingPerson = () => {
    if (!selectedPerson) return;
    
    if (selectedAttendees.includes(selectedPerson)) {
      setSnackbar({ open: true, message: 'This person is already added as an attendee', severity: 'warning' });
      return;
    }
    
    setSelectedAttendees([...selectedAttendees, selectedPerson]);
    setSelectedPerson('');
  };

  const handleRemoveAttendee = (index) => {
    const updatedAttendees = [...selectedAttendees];
    updatedAttendees.splice(index, 1);
    setSelectedAttendees(updatedAttendees);
  };

  const handleAddNewPerson = () => {
    if (!newPersonName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    
    const trimmedName = newPersonName.trim();
    
    if (people.includes(trimmedName)) {
      setSnackbar({ open: true, message: 'This person already exists in the people list', severity: 'error' });
      return;
    }
    
    if (selectedAttendees.includes(trimmedName)) {
      setSnackbar({ open: true, message: 'This person is already added as an attendee', severity: 'warning' });
      return;
    }
    
    // Add to global people list
    setPeople([...people, trimmedName]);
    
    // Add to selected attendees
    setSelectedAttendees([...selectedAttendees, trimmedName]);
    
    // Reset form and close dialog
    setNewPersonName('');
    setOpenDialog(false);
    
    setSnackbar({ open: true, message: 'New person added successfully', severity: 'success' });
  };

  const startMeetingSetup = () => {
    if (!meetingDate) {
      setSnackbar({ open: true, message: 'Please enter a meeting date', severity: 'error' });
      return;
    }
    
    if (selectedAttendees.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one attendee', severity: 'error' });
      return;
    }
    
    const meetingInfo = { 
      date: meetingDate, 
      attendees: selectedAttendees 
    };
    setCurrentMeeting(meetingInfo);
    navigate('/setup');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">New Meeting Setup</Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Meeting Details</Typography>
          
          <TextField
            label="Meeting Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 3 }}
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Attendees</Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <FormControl fullWidth sx={{ mr: 2 }}>
              <InputLabel id="select-person-label">Select Person</InputLabel>
              <Select
                labelId="select-person-label"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                label="Select Person"
              >
                <MenuItem value="">
                  <em>Select a person</em>
                </MenuItem>
                {people.map((person, index) => (
                  <MenuItem key={index} value={person}>
                    {person}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select from existing people</FormHelperText>
            </FormControl>
            
            <Button 
              variant="contained" 
              onClick={handleAddExistingPerson}
              disabled={!selectedPerson}
              sx={{ minWidth: '120px' }}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add New Person
            </Button>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Selected Attendees ({selectedAttendees.length})
          </Typography>
          
          {selectedAttendees.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No attendees selected yet. Add people to include them in the meeting.
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <List dense>
                {selectedAttendees.map((attendee, index) => (
                  <ListItem key={index} divider={index < selectedAttendees.length - 1}>
                    <ListItemText primary={attendee} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveAttendee(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={startMeetingSetup}
            disabled={!meetingDate || selectedAttendees.length === 0}
          >
            Next: Upload Excel
          </Button>
        </Box>
      </Paper>
      
      {/* Add New Person Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNewPerson} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
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

export default MeetingPage;
