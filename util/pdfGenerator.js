const PDFDocument = require('pdfkit');

const generatePdfBuffer = (movieDetails) => {

    return new Promise((resolve, reject) => {

        const doc = new PDFDocument();
        
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));

        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });

        // Create the pdf

        doc.fontSize(24).fillColor('#1d2736').text('Flick Tickets', {align : 'center', bold: true});

        doc.moveDown();
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().fillColor('#3d5c82');
        
        doc.moveDown(2);
        
        doc.fontSize(18).fillColor('#1a3138').text('Booked show details', {align: 'center', underline: true});
        
        doc.moveDown(2);
        
        doc.fontSize(15).fillColor('#02041f').text(`Movie : ${movieDetails.title}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Date : ${movieDetails.date}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Time : ${movieDetails.time}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Theatre : ${movieDetails.theatre}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Location : ${movieDetails.address}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Seats : ${movieDetails.seats}`, {align: 'left'});
        doc.moveDown();
        doc.fontSize(15).fillColor('#02041f').text(`Transaction Id : ${movieDetails.transactionId}`, {align: 'left'});
        doc.moveDown(2);
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().fillColor('#3d5c82');
        
        doc.moveDown();

        doc.fontSize(14).fillColor('##2a2d61').text(`Thank you for booking! visit again!`, {align: 'center', italic: true});
        
        doc.moveDown();

        doc.end();
    });
}

module.exports = generatePdfBuffer;