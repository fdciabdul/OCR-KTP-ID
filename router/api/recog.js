const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const worker = createWorker({
  logger: m => console.log(m), // Add logger here
});
module.exports = async function (app) {


  app.post('/api/ocr', async (req, res) => {
    try {
      console.log(req.files);
      const lokasiFoto = req.files.images.tempFilePath
      const tempPath = "tmp/" + path.basename(lokasiFoto) + ".jpeg";

      const convert = sharp(lokasiFoto)
        .toColourspace('gray')
        .toFormat('jpeg')
        .jpeg({ quality:60 })
        .toFile(tempPath);
   
      await worker.load();
      await worker.loadLanguage('ktp');
      await worker.initialize('ktp');
      const { data: { text } } = await worker.recognize(tempPath);
      console.log(text);
      const cleanResOCR = text;
      console.log(cleanResOCR);
      
          let NIK = cleanResOCR.match(/([0-9]{16})/gi);
          NIK = cleanResOCR.match(/(?<=NIK).*?(?=\n)/gm)

       
          // get name from ktp
          const nama = cleanResOCR.match(/(?<=Nama).*?(?=\n)/gm)
          // get tannggal lahir from ktp
          const tanggalLahir = cleanResOCR.match(/([0-9]{2}\-[0-9]{2}\-[0-9]{4})/gm)
          let result = { status: true, data:
          [{
            nama : nama,
            NIK : NIK.toString().replace(/:/g, ''),
            tanggalLahir : tanggalLahir,

          }
          ]
          }
        
     // unlink temp file with unlinksync
      fs.unlinkSync(tempPath);
      fs.unlinkSync(lokasiFoto);
      return res.json(result)

    } catch (err) {
      return res.json({ success: false, message: err.message })
    }

  })
}