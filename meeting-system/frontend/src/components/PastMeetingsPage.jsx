import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Container,
  Paper,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';

function PastMeetingsPage() {
  const navigate = useNavigate();
  const [pastMeetings, setPastMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: -1 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const savedMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
    setPastMeetings(savedMeetings);
    setFilteredMeetings(savedMeetings);
  }, []);

  useEffect(() => {
    // Apply filtering and sorting whenever pastMeetings, searchTerm, or sortOrder changes
    let filtered = [...pastMeetings];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting => 
        meeting.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.attendees.some(attendee => 
          attendee.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date);
      const dateB = new Date(b.timestamp || b.date);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
    
    setFilteredMeetings(filtered);
  }, [pastMeetings, searchTerm, sortOrder]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const confirmDeleteMeeting = (index) => {
    setDeleteDialog({ open: true, index });
  };

  const deleteMeeting = () => {
    const updatedMeetings = [...pastMeetings];
    updatedMeetings.splice(deleteDialog.index, 1);
    setPastMeetings(updatedMeetings);
    localStorage.setItem('pastMeetings', JSON.stringify(updatedMeetings));
    
    setDeleteDialog({ open: false, index: -1 });
    setSnackbar({
      open: true,
      message: 'Meeting deleted successfully',
      severity: 'success'
    });
  };

  const exportMeetingToExcel = (meeting, index) => {
    if (!meeting || !meeting.responses) return;
    
    // Prepare data for Excel export
    const rows = Object.entries(meeting.responses).map(([id, data]) => ({
      IsolationID: id,
      Risk: data.risk || '',
      Mitigation: data.mitigation || '',
      PartsRequired: data.partsRequired || '',
      PartsArrival: data.partsArrival || '',
      MOCRequired: data.mocRequired || '',
      MOCNumber: data.mocNumber || '',
      MOCComments: data.mocComments || '',
      EngineeringSupport: data.engineeringSupport || '',
      EngineerName: data.engineerName || '',
      EngineerETA: data.engineerETA || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Summary');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `MeetingSummary-${meeting.date}.xlsx`);
    
    setSnackbar({
      open: true,
      message: 'Excel file downloaded successfully!',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate statistics for a meeting
  const getMeetingStats = (meeting) => {
    if (!meeting || !meeting.responses) return null;
    
    // If statistics are already calculated, use them
    if (meeting.statistics) return meeting.statistics;
    
    // Otherwise, calculate them
    const stats = {
      total: meeting.responses ? Object.keys(meeting.responses).length : 0,
      byRisk: { Low: 0, Medium: 0, High: 0 },
      byParts: { Yes: 0, No: 0 },
      byMOC: { Yes: 0, No: 0 },
      byEngineering: { Yes: 0, No: 0 }
    };
    
    if (meeting.responses) {
      Object.values(meeting.responses).forEach(response => {
        // Count by risk
        if (response.risk) {
          stats.byRisk[response.risk] = (stats.byRisk[response.risk] || 0) + 1;
        }
        
        // Count by parts required
        if (response.partsRequired) {
          stats.byParts[response.partsRequired] = (stats.byParts[response.partsRequired] || 0) + 1;
        }
        
        // Count by MOC required
        if (response.mocRequired) {
          stats.byMOC[response.mocRequired] = (stats.byMOC[response.mocRequired] || 0) + 1;
        }
        
        // Count by engineering support
        if (response.engineeringSupport) {
          stats.byEngineering[response.engineeringSupport] = (stats.byEngineering[response.engineeringSupport] || 0) + 1;
        }
      });
    }
    
    return stats;
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Past Meetings</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Search and Filter Controls */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by date or attendee"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="sort-order-label">Sort Order</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Sort Order"
                onChange={handleSortChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Meeting List */}
        {filteredMeetings.length === 0 ? (
          <Box textAlign="center" py={5}>
            {pastMeetings.length === 0 ? (
              <Typography variant="h6" color="text.secondary">No past meetings recorded yet.</Typography>
            ) : (
              <Typography variant="h6" color="text.secondary">No meetings match your search criteria.</Typography>
            )}
          </Box>
        ) : (
          <Box>
            {filteredMeetings.map((meeting, index) => {
              const stats = getMeetingStats(meeting);
              
              return (
                <Accordion 
                  key={index} 
                  sx={{ mb: 2 }}
                  expanded={expandedPanel === index}
                  onChange={handleAccordionChange(index)}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '&.Mui-expanded': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      }
                    }}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h6">
                          {meeting.date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(meeting.timestamp || meeting.date).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Attendees:</strong> {meeting.attendees.length}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Isolations:</strong> {stats ? stats.total : (meeting.responses ? Object.keys(meeting.responses).length : 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {stats && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.High || 0} High`} 
                              color="error" 
                              variant="outlined" 
                            />
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.Medium || 0} Medium`} 
                              color="warning" 
                              variant="outlined" 
                            />
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.Low || 0} Low`} 
                              color="success" 
                              variant="outlined" 
                            />
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 3, pb: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Summary" />
                        <Tab label="Isolations" />
                        {meeting.addedIsolations && meeting.addedIsolations.length > 0 && (
                          <Tab label="Changes" />
                        )}
                      </Tabs>
                    </Box>
                    
                    {/* Summary Tab */}
                    {tabValue === 0 && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Meeting Information</Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                <Typography variant="body1">{meeting.date}</Typography>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Attendees</Typography>
                                <Typography variant="body1">{meeting.attendees.join(', ')}</Typography>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Total Isolations Reviewed</Typography>
                                <Typography variant="body1">{stats ? stats.total : (meeting.responses ? Object.keys(meeting.responses).length : 0)}</Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Statistics</Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              {stats && (
                                <Grid container spacing={3}>
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Risk Levels</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Chip 
                                        icon={<CheckCircleIcon />} 
                                        label={`Low: ${stats.byRisk.Low || 0}`} 
                                        color="success" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        icon={<WarningIcon />} 
                                        label={`Medium: ${stats.byRisk.Medium || 0}`} 
                                        color="warning" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        icon={<ErrorIcon />} 
                                        label={`High: ${stats.byRisk.High || 0}`} 
                                        color="error" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                    </Box>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parts Required</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Chip 
                                        label={`Yes: ${stats.byParts.Yes || 0}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        label={`No: ${stats.byParts.No || 0}`} 
                                        color="default" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                    </Box>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Engineering Support</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Chip 
                                        label={`Yes: ${stats.byEngineering.Yes || 0}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        label={`No: ${stats.byEngineering.No || 0}`} 
                                        color="default" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                    </Box>
                                  </Grid>
                                </Grid>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                    
                    {/* Isolations Tab */}
                    {tabValue === 1 && (
                      <List>
                        {meeting.responses && Object.entries(meeting.responses).map(([id, data]) => (
                          <ListItem key={id} divider>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="subtitle1">ID: {id}</Typography>
                                <Chip 
                                  label={data.risk} 
                                  color={
                                    data.risk === 'High' ? 'error' : 
                                    data.risk === 'Medium' ? 'warning' : 'success'
                                  }
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </Grid>
                              
                              <Grid item xs={12} sm={9}>
                                <Grid container spacing={1}>
                                  <Grid item xs={6} sm={4}>
                                    <Typography variant="body2" color="text.secondary">Parts: {data.partsRequired}</Typography>
                                    {data.partsRequired === 'Yes' && (
                                      <Typography variant="body2" color="text.secondary">Arrival: {data.partsArrival}</Typography>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={6} sm={4}>
                                    <Typography variant="body2" color="text.secondary">MOC: {data.mocRequired}</Typography>
                                    {data.mocRequired === 'Yes' && (
                                      <Typography variant="body2" color="text.secondary">Number: {data.mocNumber}</Typography>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={6} sm={4}>
                                    <Typography variant="body2" color="text.secondary">Engineering: {data.engineeringSupport}</Typography>
                                    {data.engineeringSupport === 'Yes' && (
                                      <Typography variant="body2" color="text.secondary">Engineer: {data.engineerName}</Typography>
                                    )}
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                    )}
                    
                    {/* Changes Tab */}
                    {tabValue === 2 && meeting.addedIsolations && meeting.addedIsolations.length > 0 && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" gutterBottom color="success.main">New Isolations Added</Typography>
                          <List sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', borderRadius: 1 }}>
                            {meeting.addedIsolations.map((item, idx) => (
                              <ListItem key={idx} divider>
                                <ListItemText 
                                  primary={`${item.Title || item.id}`} 
                                  secondary={
                                    <Box>
                                      {Object.entries(item)
                                        .filter(([key]) => key !== 'id' && key !== 'Title')
                                        .map(([key, value]) => (
                                          <Typography key={key} variant="body2" component="span" sx={{ mr: 2 }}>
                                            <strong>{key}:</strong> {value}
                                          </Typography>
                                        ))
                                      }
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        
                        {meeting.removedIsolations && meeting.removedIsolations.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom color="error.main">Isolations Removed</Typography>
                            <List sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1 }}>
                              {meeting.removedIsolations.map((item, idx) => (
                                <ListItem key={idx} divider>
                                  <ListItemText 
                                    primary={`${item.Title || item.id}`} 
                                    secondary={
                                      <Box>
                                        {Object.entries(item)
                                          .filter(([key]) => key !== 'id' && key !== 'Title')
                                          .map(([key, value]) => (
                                            <Typography key={key} variant="body2" component="span" sx={{ mr: 2 }}>
                                              <strong>{key}:</strong> {value}
                                            </Typography>
                                          ))
                                        }
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        )}
                      </Grid>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Tooltip title="Export to Excel">
                        <IconButton 
                          color="primary" 
                          onClick={() => exportMeetingToExcel(meeting, index)}
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Meeting">
                        <IconButton 
                          color="error" 
                          onClick={() => confirmDeleteMeeting(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Delete Meeting?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this meeting? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={deleteMeeting} color="error" variant="contained">
            Delete
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

export default PastMeetingsPage;
