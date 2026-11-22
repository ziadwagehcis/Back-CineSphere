const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { MongoClient } = require("mongodb");

const connectionUri =
  process.env.MONGODB_CONNECTION ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/movies";
const dbName = process.env.DB_NAME || "movies";

const movies = [
  {
    title: "Inception",
    year: 2010,
    rating: 8.8,
    director: "Christopher Nolan",
    duration: "148 min",
    genres: ["Sci-Fi", "Action", "Thriller"],
    cast: [
      "Leonardo DiCaprio",
      "Joseph Gordon-Levitt",
      "Elliot Page",
      "Tom Hardy",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    description:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    featured: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    title: "The Dark Knight",
    year: 2008,
    rating: 9.0,
    director: "Christopher Nolan",
    duration: "152 min",
    genres: ["Action", "Crime", "Drama"],
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    featured: true,
    createdAt: new Date("2024-01-02"),
  },
  {
    title: "Interstellar",
    year: 2014,
    rating: 8.7,
    director: "Christopher Nolan",
    duration: "169 min",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    cast: [
      "Matthew McConaughey",
      "Anne Hathaway",
      "Jessica Chastain",
      "Michael Caine",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description:
      "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
    featured: true,
    createdAt: new Date("2024-01-03"),
  },
  {
    title: "Pulp Fiction",
    year: 1994,
    rating: 8.9,
    director: "Quentin Tarantino",
    duration: "154 min",
    genres: ["Crime", "Drama"],
    cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson", "Bruce Willis"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    featured: true,
    createdAt: new Date("2024-01-04"),
  },
  {
    title: "The Matrix",
    year: 1999,
    rating: 8.7,
    director: "Lana Wachowski, Lilly Wachowski",
    duration: "136 min",
    genres: ["Action", "Sci-Fi"],
    cast: [
      "Keanu Reeves",
      "Laurence Fishburne",
      "Carrie-Anne Moss",
      "Hugo Weaving",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    description:
      "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    featured: false,
    createdAt: new Date("2024-01-05"),
  },
  {
    title: "The Shawshank Redemption",
    year: 1994,
    rating: 9.3,
    director: "Frank Darabont",
    duration: "142 min",
    genres: ["Drama"],
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    description:
      "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.",
    featured: true,
    createdAt: new Date("2024-01-06"),
  },
  {
    title: "Dune: Part Two",
    year: 2024,
    rating: 8.6,
    director: "Denis Villeneuve",
    duration: "166 min",
    genres: ["Sci-Fi", "Adventure", "Action"],
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/1pdfLvk8ke9cG915qwYqlwlJylW.jpg",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    featured: true,
    createdAt: new Date("2024-01-07"),
  },
  {
    title: "Oppenheimer",
    year: 2023,
    rating: 8.9,
    director: "Christopher Nolan",
    duration: "180 min",
    genres: ["Biography", "Drama", "History"],
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    featured: true,
    createdAt: new Date("2024-01-08"),
  },
  {
    title: "Fight Club",
    year: 1999,
    rating: 8.8,
    director: "David Fincher",
    duration: "139 min",
    genres: ["Drama", "Thriller"],
    cast: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter", "Meat Loaf"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    description:
      "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    featured: false,
    createdAt: new Date("2024-01-09"),
  },
  {
    title: "Forrest Gump",
    year: 1994,
    rating: 8.8,
    director: "Robert Zemeckis",
    duration: "142 min",
    genres: ["Drama", "Romance"],
    cast: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    description:
      "The history of the United States from the 1950s to the '70s unfolds through the eyes of an Alabama man with an IQ of 75, who yearns to be reunited with his childhood sweetheart.",
    featured: false,
    createdAt: new Date("2024-01-10"),
  },
  {
    title: "The Wolf of Wall Street",
    year: 2013,
    rating: 8.2,
    director: "Martin Scorsese",
    duration: "180 min",
    genres: ["Biography", "Comedy", "Crime"],
    cast: [
      "Leonardo DiCaprio",
      "Jonah Hill",
      "Margot Robbie",
      "Matthew McConaughey",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg",
    description:
      "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government.",
    featured: false,
    createdAt: new Date("2024-01-11"),
  },
  {
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    rating: 8.7,
    director: "Joaquim Dos Santos, Kemp Powers",
    duration: "140 min",
    genres: ["Animation", "Action", "Adventure"],
    cast: [
      "Shameik Moore",
      "Hailee Steinfeld",
      "Oscar Isaac",
      "Daniel Kaluuya",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    description:
      "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    featured: false,
    createdAt: new Date("2024-01-12"),
  },
  {
    title: "Spirited Away",
    year: 2001,
    rating: 8.6,
    director: "Hayao Miyazaki",
    duration: "125 min",
    genres: ["Animation", "Adventure", "Fantasy"],
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki", "Takashi Naito"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    description:
      "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits, a world where humans are changed into beasts.",
    featured: false,
    createdAt: new Date("2024-01-13"),
  },
  {
    title: "Parasite",
    year: 2019,
    rating: 8.5,
    director: "Bong Joon Ho",
    duration: "132 min",
    genres: ["Drama", "Thriller", "Comedy"],
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    description:
      "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    featured: false,
    createdAt: new Date("2024-01-14"),
  },
  {
    title: "Gladiator",
    year: 2000,
    rating: 8.5,
    director: "Ridley Scott",
    duration: "155 min",
    genres: ["Action", "Adventure", "Drama"],
    cast: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    description:
      "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    featured: false,
    createdAt: new Date("2024-01-15"),
  },
  {
    title: "Whiplash",
    year: 2014,
    rating: 8.5,
    director: "Damien Chazelle",
    duration: "106 min",
    genres: ["Drama", "Music"],
    cast: ["Miles Teller", "J.K. Simmons", "Melissa Benoist", "Paul Reiser"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    description:
      "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
    featured: false,
    createdAt: new Date("2024-01-16"),
  },
  {
    title: "Avengers: Endgame",
    year: 2019,
    rating: 8.4,
    director: "Anthony Russo, Joe Russo",
    duration: "181 min",
    genres: ["Action", "Adventure", "Sci-Fi"],
    cast: [
      "Robert Downey Jr.",
      "Chris Evans",
      "Mark Ruffalo",
      "Scarlett Johansson",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    description:
      "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions.",
    featured: false,
    createdAt: new Date("2024-01-17"),
  },
  {
    title: "Coco",
    year: 2017,
    rating: 8.4,
    director: "Lee Unkrich, Adrian Molina",
    duration: "105 min",
    genres: ["Animation", "Adventure", "Comedy"],
    cast: [
      "Anthony Gonzalez",
      "Gael García Bernal",
      "Benjamin Bratt",
      "Alanna Ubach",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
    description:
      "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    featured: false,
    createdAt: new Date("2024-01-18"),
  },
  {
    title: "Get Out",
    year: 2017,
    rating: 7.8,
    director: "Jordan Peele",
    duration: "104 min",
    genres: ["Horror", "Mystery", "Thriller"],
    cast: [
      "Daniel Kaluuya",
      "Allison Williams",
      "Bradley Whitford",
      "Catherine Keener",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    description:
      "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.",
    featured: false,
    createdAt: new Date("2024-01-19"),
  },
  {
    title: "La La Land",
    year: 2016,
    rating: 8.0,
    director: "Damien Chazelle",
    duration: "128 min",
    genres: ["Comedy", "Drama", "Music", "Romance"],
    cast: ["Ryan Gosling", "Emma Stone", "Rosemarie DeWitt", "John Legend"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJb0Rf0.jpg",
    description:
      "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    featured: false,
    createdAt: new Date("2024-01-20"),
  },
  {
    title: "The Grand Budapest Hotel",
    year: 2014,
    rating: 8.1,
    director: "Wes Anderson",
    duration: "99 min",
    genres: ["Comedy", "Adventure", "Crime"],
    cast: [
      "Ralph Fiennes",
      "F. Murray Abraham",
      "Mathieu Amalric",
      "Adrien Brody",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWX9NZkt5BW.jpg",
    description:
      "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge.",
    featured: false,
    createdAt: new Date("2024-01-21"),
  },
  {
    title: "The Silence of the Lambs",
    year: 1991,
    rating: 8.6,
    director: "Jonathan Demme",
    duration: "118 min",
    genres: ["Crime", "Drama", "Thriller"],
    cast: [
      "Jodie Foster",
      "Anthony Hopkins",
      "Lawrence A. Bonney",
      "Kasi Lemmons",
    ],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    description:
      "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer, a madman who skins his victims.",
    featured: false,
    createdAt: new Date("2024-01-22"),
  },
  {
    title: "The Hangover",
    year: 2009,
    rating: 7.7,
    director: "Todd Phillips",
    duration: "100 min",
    genres: ["Comedy"],
    cast: ["Bradley Cooper", "Ed Helms", "Zach Galifianakis", "Justin Bartha"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg",
    description:
      "Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing. They make their way around the city in order to find their friend before his wedding.",
    featured: false,
    createdAt: new Date("2024-01-23"),
  },
  {
    title: "Blade Runner 2049",
    year: 2017,
    rating: 8.0,
    director: "Denis Villeneuve",
    duration: "164 min",
    genres: ["Sci-Fi", "Action", "Drama", "Mystery"],
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks"],
    thumbnail:
      "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    description:
      "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
    featured: false,
    createdAt: new Date("2024-01-24"),
  },
];

function catalogMovie(title, year, rating, director, runtime, genres, cast) {
  return {
    title,
    year,
    rating,
    director,
    duration: `${runtime} min`,
    genres,
    cast,
    thumbnail: "",
    description: "",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

movies.push(
  catalogMovie("The Godfather Part II", 1974, 9.0, "Francis Ford Coppola", 202, ["Crime", "Drama"], ["Al Pacino", "Robert De Niro", "Diane Keaton"]),
  catalogMovie("12 Angry Men", 1957, 9.0, "Sidney Lumet", 96, ["Drama"], ["Henry Fonda", "Lee J. Cobb", "Martin Balsam"]),
  catalogMovie("Goodfellas", 1990, 8.7, "Martin Scorsese", 145, ["Biography", "Crime", "Drama"], ["Robert De Niro", "Ray Liotta", "Joe Pesci"]),
  catalogMovie("The Departed", 2006, 8.5, "Martin Scorsese", 151, ["Crime", "Drama", "Thriller"], ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson"]),
  catalogMovie("Parasite", 2019, 8.5, "Bong Joon Ho", 132, ["Drama", "Thriller"], ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"]),
  catalogMovie("Whiplash", 2014, 8.5, "Damien Chazelle", 107, ["Drama", "Music"], ["Miles Teller", "J. K. Simmons", "Paul Reiser"]),
  catalogMovie("The Prestige", 2006, 8.5, "Christopher Nolan", 130, ["Drama", "Mystery", "Sci-Fi"], ["Christian Bale", "Hugh Jackman", "Scarlett Johansson"]),
  catalogMovie("Django Unchained", 2012, 8.5, "Quentin Tarantino", 165, ["Drama", "Western"], ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio"]),
  catalogMovie("Mad Max: Fury Road", 2015, 8.1, "George Miller", 120, ["Action", "Adventure", "Sci-Fi"], ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"]),
  catalogMovie("The Truman Show", 1998, 8.2, "Peter Weir", 103, ["Comedy", "Drama", "Sci-Fi"], ["Jim Carrey", "Laura Linney", "Ed Harris"]),
  catalogMovie("Eternal Sunshine of the Spotless Mind", 2004, 8.3, "Michel Gondry", 108, ["Drama", "Romance", "Sci-Fi"], ["Jim Carrey", "Kate Winslet", "Kirsten Dunst"]),
  catalogMovie("The Grand Budapest Hotel", 2014, 8.1, "Wes Anderson", 99, ["Adventure", "Comedy"], ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan"]),
  catalogMovie("Jaws", 1975, 8.1, "Steven Spielberg", 124, ["Adventure", "Thriller"], ["Roy Scheider", "Robert Shaw", "Richard Dreyfuss"]),
  catalogMovie("Jurassic Park", 1993, 8.2, "Steven Spielberg", 127, ["Adventure", "Sci-Fi", "Thriller"], ["Sam Neill", "Laura Dern", "Jeff Goldblum"]),
  catalogMovie("Saving Private Ryan", 1998, 8.6, "Steven Spielberg", 169, ["Drama", "War"], ["Tom Hanks", "Matt Damon", "Tom Sizemore"]),
  catalogMovie("The Green Mile", 1999, 8.6, "Frank Darabont", 189, ["Crime", "Drama", "Fantasy"], ["Tom Hanks", "Michael Clarke Duncan", "David Morse"]),
  catalogMovie("Life Is Beautiful", 1997, 8.6, "Roberto Benigni", 116, ["Comedy", "Drama", "Romance"], ["Roberto Benigni", "Nicoletta Braschi", "Giorgio Cantarini"]),
  catalogMovie("The Intouchables", 2011, 8.5, "Olivier Nakache, Éric Toledano", 112, ["Comedy", "Drama"], ["François Cluzet", "Omar Sy", "Anne Le Ny"]),
  catalogMovie("The Lives of Others", 2006, 8.4, "Florian Henckel von Donnersmarck", 137, ["Drama", "Mystery", "Thriller"], ["Ulrich Mühe", "Martina Gedeck", "Sebastian Koch"]),
  catalogMovie("The Hunt", 2012, 8.3, "Thomas Vinterberg", 115, ["Drama"], ["Mads Mikkelsen", "Thomas Bo Larsen", "Annika Wedderkopp"]),
  catalogMovie("A Beautiful Mind", 2001, 8.2, "Ron Howard", 135, ["Biography", "Drama"], ["Russell Crowe", "Jennifer Connelly", "Ed Harris"]),
  catalogMovie("The Pianist", 2002, 8.5, "Roman Polanski", 150, ["Biography", "Drama", "Music"], ["Adrien Brody", "Thomas Kretschmann", "Frank Finlay"]),
  catalogMovie("Gladiator", 2000, 8.5, "Ridley Scott", 155, ["Action", "Adventure", "Drama"], ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen"]),
  catalogMovie("The Lord of the Rings: The Fellowship of the Ring", 2001, 8.9, "Peter Jackson", 178, ["Adventure", "Drama", "Fantasy"], ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"]),
  catalogMovie("The Lord of the Rings: The Two Towers", 2002, 8.8, "Peter Jackson", 179, ["Adventure", "Drama", "Fantasy"], ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"]),
  catalogMovie("The Lord of the Rings: The Return of the King", 2003, 9.0, "Peter Jackson", 201, ["Adventure", "Drama", "Fantasy"], ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"]),
  catalogMovie("Coco", 2017, 8.4, "Lee Unkrich", 105, ["Adventure", "Animation", "Family"], ["Anthony Gonzalez", "Gael García Bernal", "Benjamin Bratt"]),
  catalogMovie("Ratatouille", 2007, 8.1, "Brad Bird", 111, ["Adventure", "Animation", "Comedy"], ["Patton Oswalt", "Ian Holm", "Lou Romano"]),
  catalogMovie("Finding Nemo", 2003, 8.2, "Andrew Stanton", 100, ["Adventure", "Animation", "Comedy"], ["Albert Brooks", "Ellen DeGeneres", "Alexander Gould"]),
  catalogMovie("Up", 2009, 8.3, "Pete Docter", 96, ["Adventure", "Animation", "Comedy"], ["Ed Asner", "Christopher Plummer", "Jordan Nagai"]),
  catalogMovie("Spider-Man: Into the Spider-Verse", 2018, 8.4, "Bob Persichetti, Peter Ramsey, Rodney Rothman", 117, ["Action", "Adventure", "Animation"], ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld"]),
  catalogMovie("Spirited Away", 2001, 8.6, "Hayao Miyazaki", 125, ["Adventure", "Animation", "Fantasy"], ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"]),
  catalogMovie("Your Name.", 2016, 8.4, "Makoto Shinkai", 106, ["Animation", "Drama", "Fantasy"], ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Ryo Narita"]),
  catalogMovie("Inside Out", 2015, 8.1, "Pete Docter", 95, ["Adventure", "Animation", "Comedy"], ["Amy Poehler", "Phyllis Smith", "Richard Kind"]),
  catalogMovie("Logan", 2017, 8.1, "James Mangold", 137, ["Action", "Drama", "Sci-Fi"], ["Hugh Jackman", "Patrick Stewart", "Dafne Keen"]),
  catalogMovie("Ford v Ferrari", 2019, 8.1, "James Mangold", 152, ["Action", "Biography", "Drama"], ["Matt Damon", "Christian Bale", "Caitríona Balfe"]),
  catalogMovie("Titanic", 1997, 7.9, "James Cameron", 194, ["Drama", "Romance"], ["Leonardo DiCaprio", "Kate Winslet", "Billy Zane"]),
  catalogMovie("Avatar", 2009, 7.9, "James Cameron", 162, ["Action", "Adventure", "Sci-Fi"], ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver"]),
  catalogMovie("The Terminator", 1984, 8.1, "James Cameron", 107, ["Action", "Sci-Fi"], ["Arnold Schwarzenegger", "Linda Hamilton", "Michael Biehn"]),
  catalogMovie("Aliens", 1986, 8.4, "James Cameron", 137, ["Action", "Adventure", "Sci-Fi"], ["Sigourney Weaver", "Michael Biehn", "Carrie Henn"]),
  catalogMovie("Get Out", 2017, 7.8, "Jordan Peele", 104, ["Horror", "Mystery", "Thriller"], ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford"]),
  catalogMovie("Everything Everywhere All at Once", 2022, 7.8, "Daniel Kwan, Daniel Scheinert", 139, ["Action", "Adventure", "Comedy"], ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan"]),
  catalogMovie("The Social Network", 2010, 7.8, "David Fincher", 120, ["Biography", "Drama"], ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake"])
);

async function seed() {
  console.log(`Connecting to MongoDB at: ${connectionUri}...`);
  const client = new MongoClient(connectionUri, {
    serverSelectionTimeoutMS: 8000,
  });
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to database '${dbName}' successfully!`);

    const collection = db.collection("movies");
    const seedResult = await collection.bulkWrite(
      movies.map(movie => ({
        updateOne: {
          filter: { title: movie.title, year: movie.year },
          update: { $setOnInsert: movie },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    console.log(
      `Catalog contains ${movies.length} curated entries; added ${seedResult.upsertedCount} new movies without replacing existing data.`,
    );

    // Create indexes for high performance search & sorting
    await collection.createIndex({
      title: "text",
      cast: "text",
      director: "text",
    });
    await collection.createIndex({ genres: 1 });
    await collection.createIndex({ year: -1 });
    await collection.createIndex({ rating: -1 });
    console.log("Indexes created successfully!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

seed();
