import Papa from 'papaparse';

export const loadCSVFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const loadCSVFromURL = async (url) => {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw new Error(`CSV読み込みエラー: ${error.message}`);
  }
};

export const getAudioURL = (audioFileName, basePath = 'assets/audio/separate_audio') => {
  const finalBasePath = `${import.meta.env.BASE_URL}${basePath}`;
  // .wavまたは.mp3を試行
  const wavPath = `${finalBasePath}/${audioFileName}.wav`;
  const mp3Path = `${finalBasePath}/${audioFileName}.mp3`;
  
  return { wavPath, mp3Path };
  
  return { wavPath, mp3Path };
};
