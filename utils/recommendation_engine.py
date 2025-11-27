import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

spanish_stop_words = [
        'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 
        'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 
        'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 
        'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 
        'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 
        'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 
        'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 
        'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 
        'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 
        'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 
        'vuestros', 'vuestras', 'es', 'soy', 'eres', 'somos', 'sois', 'son', 'sea', 'seamos', 
        'seáis', 'sean', 'sido', 'ser', 'era', 'eras', 'éramos', 'erais', 'eran', 'fui', 'fuiste', 
        'fue', 'fuimos', 'fuisteis', 'fueron', 'fuera', 'fueras', 'fuéramos', 'fuerais', 'fueran', 
        'fuese', 'fueses', 'fuésemos', 'fueseis', 'fuesen'
    ]

def obtener_ids_recomendados_ml(datos_libros, id_libro_actual, top_n=22):
    """
    Recibe una lista de diccionarios con todos los libros y devuelve los IDs de los más similares
    basándose en su descripción.
    """
    
    df = pd.DataFrame(datos_libros)
    
    df['id_libro'] = df['id_libro'].astype(int)
    id_libro_actual = int(id_libro_actual)

    df['descripcion'] = df['descripcion'].fillna('')

    tfidf = TfidfVectorizer(stop_words=spanish_stop_words)
    
    tfidf_matrix = tfidf.fit_transform(df['descripcion'])

    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    indices = pd.Series(df.index, index=df['id_libro']).drop_duplicates()
    
    if id_libro_actual not in indices:
        return []

    idx = indices[id_libro_actual]

    sim_scores = list(enumerate(cosine_sim[idx]))

    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    sim_scores = sim_scores[1:top_n+1]

    libro_indices = [i[0] for i in sim_scores]

    return df['id_libro'].iloc[libro_indices].tolist()