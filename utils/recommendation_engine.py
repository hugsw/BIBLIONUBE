import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import nltk
from nltk.corpus import stopwords

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class MotorRecomendacion:
    def __init__(self):
        self.tfidf_matrix = None
        self.indices = None
        self.df = None
        self.vectorizer = None

    def necesita_entrenamiento(self):
        """Verifica si el motor ya tiene datos cargados."""
        return self.tfidf_matrix is None

    def entrenar(self, datos_libros):
        """
        Carga los libros y calcula la matriz matemática UNA SOLA VEZ.
        Se guarda en la memoria RAM del servidor.
        """
        self.df = pd.DataFrame(datos_libros)
        self.df['id_libro'] = self.df['id_libro'].astype(int)
        self.df['descripcion'] = self.df['descripcion'].fillna('')
        lista_stopwords_es = stopwords.words('spanish')
        self.vectorizer = TfidfVectorizer(stop_words=lista_stopwords_es)
        self.tfidf_matrix = self.vectorizer.fit_transform(self.df['descripcion'])
        self.indices = pd.Series(self.df.index, index=self.df['id_libro']).drop_duplicates()

    def obtener_recomendaciones(self, id_libro_actual, top_n=22):
        """Devuelve los IDs recomendados usando la memoria pre-calculada."""
        if self.tfidf_matrix is None or self.indices is None:
            return []

        id_libro_actual = int(id_libro_actual)

        if id_libro_actual not in self.indices:
            return []

        idx = self.indices[id_libro_actual]

        cosine_sim = linear_kernel(self.tfidf_matrix[idx:idx+1], self.tfidf_matrix)

        sim_scores = list(enumerate(cosine_sim[0]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:top_n+1]

        libro_indices = [i[0] for i in sim_scores]

        return self.df['id_libro'].iloc[libro_indices].tolist()

recomendador = MotorRecomendacion()