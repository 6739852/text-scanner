import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Box, Button, Typography, Card, CardContent, CircularProgress, Stack, Container } from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ContractScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);

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

  const extractContractNumber = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
    if (lines.length >= 3) {
      const thirdLine = lines[2];
      const match = thirdLine.match(/\b\d{7}\b/); // חיפוש מספר בן 7 ספרות
      return match?.[0] || '';
    }
  
    return '';
  };
  

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setLoading(true);

    const result = await Tesseract.recognize(
      canvas.toDataURL(),
      'heb',
      { logger: m => console.log(m) }
    );

    const text = result.data.text;
    const contract = extractContractNumber(text);

    if (contract && !contracts.includes(contract)) {
      setContracts(prev => [contract, ...prev]);
    }

    setLoading(false);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([['מספר חוזה'], ...contracts.map(c => [c])]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'חוזים');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'מספרי_חוזים.xlsx');
  };

  return (
    <Container maxWidth="sm" sx={{ p: 2, mt: 6, direction: 'rtl' }}>
      <Typography variant="h4" textAlign="center" gutterBottom>
        📷 סריקת מספרי חוזה
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid #ccc',
          backgroundColor: '#000',
          aspectRatio: '4 / 3',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Stack spacing={2} direction="column" alignItems="center" mb={2}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleScan}
          disabled={loading}
        >
          {loading ? <><CircularProgress size={20} sx={{ mr: 1 }} /> סורק...</> : '📸 סרוק'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          color="secondary"
          fullWidth
          onClick={exportToExcel}
          disabled={contracts.length === 0}
        >
          📥 ייצוא לאקסל
        </Button>
      </Stack>

      <Typography variant="h6" textAlign="center" gutterBottom>
        📑 חוזים שנסרקו
      </Typography>

      <Stack spacing={1}>
        {contracts.map((contract, idx) => (
          <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography fontSize="1.1rem">🔢 מספר חוזה: {contract}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
};

export default ContractScanner;
