import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

exports.createHistory = functions.firestore
    .document('users/{userId}/devices/{deviceId}/history/{historyId}')
    .onCreate((snap, context) => {
        const newValue = snap.data();
        const id = snap.id;
        const total = newValue.totalTime;
        console.log(id);
        console.log(total);
        return new Promise((resolve, reject) => {
            resolve("A new document is added database ");
            reject("Error adding new document")
        })
    });


//run this function when there is a new document added in the correct data collection
exports.updateThresholdOnCorrectDataCreated = functions.firestore
    .document('use_cases/{caseId}/correct_data/{dataId}')
    .onCreate(async (snap, context) => {
        //get the use case ID from the wild cat
        const caseId = context.params.caseId
        //set the document reference for that use case
        var caseRef = db.collection('use_cases').doc(caseId)
        //get the peak value from the data
        const newValue = snap.data()
        const peak = newValue.peak;
        //begin transaction
        var transaction = db.runTransaction(async t => {
            return t.get(caseRef)
                .then(doc => {
                    //get the total number of correct data and add 1
                    var totalCorrect = doc.data().total_correct + 1;
                    //get the current peak average, multiply with the old total to get the sum
                    //add the new peak and divide with the new total to get the new average
                    var averageCorrectPeak = ((doc.data().average_correct_peak) * (totalCorrect - 1) + peak) / totalCorrect;
                    //get the average of the false peak
                    var averageFalsePeak = doc.data().average_false_peak;
                    //the threshold is the average of the correct and false peak
                    var threshold = (averageCorrectPeak + averageFalsePeak) / 2;
                    //update the document
                    t.update(caseRef, {
                        total_correct: totalCorrect,
                        average_correct_peak: averageCorrectPeak,
                        threshold: threshold
                    });
                }).then(result => {
                    console.log('Transaction success!');
                }).catch(err => {
                    console.log('Transaction failure:', err);
                })
        });
    })

//run this function when there is a new document added in the false data collection
exports.updateThresholdOnFalseDataCreated = functions.firestore
    .document('use_cases/{caseId}/false_data/{dataId}')
    .onCreate(async (snap, context) => {
        //get the use case ID from the wild cat
        const caseId = context.params.caseId
        //set the document reference for that use case
        var caseRef = db.collection('use_cases').doc(caseId)
        //get the peak value from the data
        const newValue = snap.data()
        const peak = newValue.peak;
        //begin transaction
        var transaction = db.runTransaction(async t => {
            return t.get(caseRef)
                .then(doc => {
                    //get the total number of false data and add 1
                    var totalFalse = doc.data().total_false + 1;
                    //get the current peak average, multiply with the old total to get the sum
                    //add the new peak and divide with the new total to get the new average
                    var averageFalsePeak = ((doc.data().average_false_peak) * (totalFalse - 1) + peak) / totalFalse;
                    //get the average of the correct peak
                    var averageCorrectPeak = doc.data().average_correct_peak;
                    //the threshold is the average of the correct and false peak
                    var threshold = (averageCorrectPeak + averageFalsePeak) / 2;
                    //update the document
                    t.update(caseRef, {
                        total_false: totalFalse,
                        average_false_peak: averageFalsePeak,
                        threshold: threshold
                    });
                }).then(result => {
                    console.log('Transaction success!');
                }).catch(err => {
                    console.log('Transaction failure:', err);
                })
        });
    })