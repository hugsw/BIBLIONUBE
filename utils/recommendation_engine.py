import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

def obtener_ids_recomendados_ml(datos_libros, id_libro_actual, top_n=4):
    """
    Recibe una lista de diccionarios con todos los libros y devuelve los IDs de los más similares
    basándose en su descripción.
    """
    
    # 1. Convertimos los datos a un DataFrame de Pandas
    df = pd.DataFrame(datos_libros)
    
    # Asegurarnos de que el ID sea entero para poder buscarlo
    df['id_libro'] = df['id_libro'].astype(int)
    id_libro_actual = int(id_libro_actual)

    # 2. Limpieza básica: Si no hay descripción, ponemos texto vacío
    df['descripcion'] = df['descripcion'].fillna('')

    # Lista básica de stop words en español para filtrar palabras comunes que no aportan significado
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

    # 3. Vectorización TF-IDF
    # Esto convierte las palabras en números, ignorando las palabras de nuestra lista
    tfidf = TfidfVectorizer(stop_words=spanish_stop_words)
    
    # Aquí es donde el modelo "aprende" el vocabulario de tus libros
    tfidf_matrix = tfidf.fit_transform(df['descripcion'])

    # 4. Calcular Similitud del Coseno
    # Compara todos los libros contra todos los libros matemáticamente
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    # 5. Encontrar el libro actual en la tabla
    # Creamos un índice para buscar rápido la posición del libro por su ID
    indices = pd.Series(df.index, index=df['id_libro']).drop_duplicates()
    
    if id_libro_actual not in indices:
        return [] # Si el ID no existe, retornamos lista vacía

    idx = indices[id_libro_actual]

    # 6. Obtener los puntajes de similitud para este libro específico
    sim_scores = list(enumerate(cosine_sim[idx]))

    # 7. Ordenar los libros del más parecido al menos parecido
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # 8. Tomar los mejores resultados (Top N)
    # Empezamos desde el índice 1 porque el 0 es el mismo libro (similitud 100%)
    sim_scores = sim_scores[1:top_n+1]

    # 9. Obtener los índices de los libros recomendados
    libro_indices = [i[0] for i in sim_scores]

    # Retornar la lista de IDs de los libros ganadores
    return df['id_libro'].iloc[libro_indices].tolist()