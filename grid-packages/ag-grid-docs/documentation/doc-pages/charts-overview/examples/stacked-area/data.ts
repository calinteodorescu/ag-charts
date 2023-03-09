// Source: https://www.gov.uk/government/statistical-data-sets/museums-and-galleries-monthly-visits
const year = new Date().getFullYear() - 1;
export function getData(): any[] {
    return [
        { date: new Date(Date.UTC(year, 0, 1)), "Science Museum": 237881, "National Media Museum": 32560, "National Railway Museum": 40148, "Locomotion": 5967, "Museum of Science and Industry, Manchester": 35122, "National Coal Mining Museum for England": 4947, },
        { date: new Date(Date.UTC(year, 1, 1)), "Science Museum": 272074, "National Media Museum": 49546, "National Railway Museum": 57824, "Locomotion": 7659, "Museum of Science and Industry, Manchester": 52192, "National Coal Mining Museum for England": 7825, },
        { date: new Date(Date.UTC(year, 2, 1)), "Science Museum": 285715, "National Media Museum": 35009, "National Railway Museum": 51892, "Locomotion": 9856, "Museum of Science and Industry, Manchester": 42920, "National Coal Mining Museum for England": 6276, },
        { date: new Date(Date.UTC(year, 3, 1)), "Science Museum": 314865, "National Media Museum": 36572, "National Railway Museum": 68999, "Locomotion": 13746, "Museum of Science and Industry, Manchester": 47432, "National Coal Mining Museum for England": 12091, },
        { date: new Date(Date.UTC(year, 4, 1)), "Science Museum": 229772, "National Media Museum": 30497, "National Railway Museum": 56119, "Locomotion": 18445, "Museum of Science and Industry, Manchester": 44595, "National Coal Mining Museum for England": 11080, },
        { date: new Date(Date.UTC(year, 5, 1)), "Science Museum": 241065, "National Media Museum": 29018, "National Railway Museum": 48814, "Locomotion": 17326, "Museum of Science and Industry, Manchester": 41630, "National Coal Mining Museum for England": 8599, },
        { date: new Date(Date.UTC(year, 6, 1)), "Science Museum": 354943, "National Media Museum": 47193, "National Railway Museum": 66416, "Locomotion": 23121, "Museum of Science and Industry, Manchester": 64302, "National Coal Mining Museum for England": 10431, },
        { date: new Date(Date.UTC(year, 7, 1)), "Science Museum": 363725, "National Media Museum": 51087, "National Railway Museum": 94972, "Locomotion": 32138, "Museum of Science and Industry, Manchester": 68135, "National Coal Mining Museum for England": 20140, },
        { date: new Date(Date.UTC(year, 8, 1)), "Science Museum": 196336, "National Media Museum": 29462, "National Railway Museum": 55506, "Locomotion": 13825, "Museum of Science and Industry, Manchester": 39673, "National Coal Mining Museum for England": 8216, },
        { date: new Date(Date.UTC(year, 9, 1)), "Science Museum": 312781, "National Media Museum": 42880, "National Railway Museum": 73100, "Locomotion": 17296, "Museum of Science and Industry, Manchester": 51834, "National Coal Mining Museum for England": 8444, },
        { date: new Date(Date.UTC(year, 10, 1)), "Science Museum": 254938, "National Media Museum": 29745, "National Railway Museum": 51243, "Locomotion": 13826, "Museum of Science and Industry, Manchester": 35991, "National Coal Mining Museum for England": 5903, },
        { date: new Date(Date.UTC(year, 11, 1)), "Science Museum": 237880, "National Media Museum": 26347, "National Railway Museum": 49346, "Locomotion": 7492, "Museum of Science and Industry, Manchester": 32697, "National Coal Mining Museum for England": 6409, },
    ];
}