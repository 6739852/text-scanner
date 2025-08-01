import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Box, Button, Typography, Card, CardContent, CircularProgress, Stack, Container, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReturnMailScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState([]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setStream(s);
        }
      } catch (error) {
        alert("בדוק הרשאות מצלמה בדפדפן");
      }
    };

    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // המרה לגווני אפור וחידוד ניגודיות
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const enhanced = gray > 128 ? 255 : 0; // threshold binary
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const extractRecipientInfo = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // חיפוש פרטי נמען
    const namePattern = /^[א-ת\s]+$/;
    const addressPattern = /[א-ת\s\d,.-]+/;
    const phonePattern = /\d{2,3}-?\d{7}/;
    const postalCodePattern = /\d{5,7}/;
    
    let recipientInfo = {
      fullText: text,
      name: '',
      address: '',
      phone: '',
      postalCode: '',
      timestamp: new Date().toLocaleString('he-IL')
    };
    
    // חיפוש שם (בדרך כלל בשורות הראשונות)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (namePattern.test(lines[i]) && lines[i].length > 2) {
        recipientInfo.name = lines[i];
        break;
      }
    }
    
    // חיפוש כתובת
    const addressLines = lines.filter(line => 
      addressPattern.test(line) && 
      line.length > 5 && 
      !phonePattern.test(line)
    );
    if (addressLines.length > 0) {
      recipientInfo.address = addressLines.join(', ');
    }
    
    // חיפוש טלפון
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
      recipientInfo.phone = phoneMatch[0];
    }
    
    // חיפוש מיקוד
    const postalMatch = text.match(postalCodePattern);
    if (postalMatch) {
      recipientInfo.postalCode = postalMatch[0];
    }
    
    return recipientInfo;
  };
  

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // עיבוד מקדים של התמונה
    preprocessImage(canvas);

    setLoading(true);

    try {
      const result = await Tesseract.recognize(
        canvas.toDataURL(),
        'heb+eng',
        {
          logger: m => console.log(m),
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: 'אבגדהוזחטיכלמנסעפצקרשת0123456789 ,.:-',
          preserve_interword_spaces: '1'
        }
      );

      const text = result.data.text;
      console.log('טקסט שזוהה:', text);
      
      if (text.trim()) {
        const recipientInfo = extractRecipientInfo(text);
        setScannedData(prev => [recipientInfo, ...prev]);
      }
    } catch (error) {
      console.error('שגיאה בסריקה:', error);
      alert('שגיאה בסריקה, נסה שוב');
    }

    setLoading(false);
  };

  const exportToExcel = () => {
    const headers = ['שם', 'כתובת', 'טלפון', 'מיקוד', 'זמן סריקה', 'טקסט מלא'];
    const data = scannedData.map(item => [
      item.name,
      item.address,
      item.phone,
      item.postalCode,
      item.timestamp,
      item.fullText
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'פרטי נמענים');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'פרטי_נמענים.xlsx');
  };

  const deleteItem = (index) => {
    setScannedData(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setScannedData([]);
  };

  return (
    <Container maxWidth="md" sx={{ p: 2, mt: 2, direction: 'rtl' }}>
      <Typography variant="h4" textAlign="center" gutterBottom>
        📮 סריקת פרטי נמענים
      </Typography>
      
      <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
        מקם את המדבקה במרכז המסך וודא שהטקסט ברור וקריא
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          border: '3px solid #1976d2',
          backgroundColor: '#000',
          aspectRatio: '4 / 3',
          position: 'relative'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto' }}
        />
        <Box
          sx={{
            position: 'absolute',
            border: '2px dashed #fff',
            width: '80%',
            height: '60%',
            borderRadius: 1,
            pointerEvents: 'none'
          }}
        />
      </Box>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Stack spacing={2} direction="row" justifyContent="center" mb={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleScan}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <><CircularProgress size={20} sx={{ mr: 1 }} /> סורק...</> : '📸 סרוק מדבקה'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={exportToExcel}
          disabled={scannedData.length === 0}
        >
          📥 ייצוא לאקסל ({scannedData.length})
        </Button>
        
        {scannedData.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={clearAll}
          >
            🗑️ נקה הכל
          </Button>
        )}
      </Stack>

      <Typography variant="h6" textAlign="center" gutterBottom>
        📋 פרטי נמענים שנסרקו ({scannedData.length})
      </Typography>

      <Stack spacing={2}>
        {scannedData.map((item, idx) => (
          <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  {item.name && (
                    <Typography variant="h6" color="primary" gutterBottom>
                      👤 {item.name}
                    </Typography>
                  )}
                  {item.address && (
                    <Typography variant="body1" gutterBottom>
                      📍 {item.address}
                    </Typography>
                  )}
                  {item.phone && (
                    <Typography variant="body2" gutterBottom>
                      📞 {item.phone}
                    </Typography>
                  )}
                  {item.postalCode && (
                    <Typography variant="body2" gutterBottom>
                      📮 מיקוד: {item.postalCode}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    🕐 {item.timestamp}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
                    טקסט מלא: {item.fullText}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => deleteItem(idx)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
};

export default ReturnMailScanner;
