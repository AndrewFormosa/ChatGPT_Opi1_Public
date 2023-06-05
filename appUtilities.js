
function convertTimeToDate(milliseconds) {
  const date = new Date(milliseconds);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return ""+day+"/"+month+"/"+year;
}


function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function eliminateDuplicates(array, field) {
  const uniqueValues = new Set();
  return array.filter(item => {
    if (!uniqueValues.has(item[field])) {
      uniqueValues.add(item[field]);
      return true;
    }
    return false;
  });
}


function sortBySimilarityAndTime(array) {
  return array.slice().sort(function(a, b) {
    if (a.similarity > b.similarity) {
      return -1; // Sort b before a by similarity
    } else if (a.similarity < b.similarity) {
      return 1; // Sort a before b by similarity
    } else {
      if (a.time > b.time) {
        return -1; // Sort a before b by time
      } else if (a.time < b.time) {
        return 1; // Sort b before a by time
      } else {
        return 0; // Leave the order unchanged
      }
    }
  });
}

function eliminateByFieldValue(array, field, value) {
  return array.filter(item => item[field] !== value);
}


module.exports = { 
  convertTimeToDate,
  cosineSimilarity,
  eliminateDuplicates,
  eliminateByFieldValue,
  sortBySimilarityAndTime
};
