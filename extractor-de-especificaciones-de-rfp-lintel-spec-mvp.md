# Extractor de Especificaciones de RFP (Lintel) — Especificación MVP

> Exportado desde **Traductor Dev** · 2/11/2026, 6:48:49 p.m.

## Resumen del proyecto

| Campo | Valor |
| --- | --- |
| Estado | draft |
| Presupuesto | $0 |
| Tipo de sistema | — |
| Plazo MVP | — |

### Objetivo

Automatizar la revisión de los RFP (Request for Proposal) que envían los clientes, comparando su contenido contra el cuestionario interno de especificaciones de construcción de Lintel (List of Requirements), para identificar rápidamente qué datos técnicos ya vienen definidos por el cliente y cuáles faltan, reduciendo el tiempo de análisis manual y el riesgo de omitir requisitos al preparar una propuesta.

### Propuesta de solución

Aplicación web (Next.js) donde el usuario sube uno o varios archivos del RFP de un cliente (PDF, Word o Excel) junto con el nombre del proyecto y cliente. El sistema extrae el texto de los archivos y usa la IA de Anthropic (Claude) para evaluar, campo por campo, un checklist interno de ~45 especificaciones (áreas construidas, empleados, alturas, estructura, iluminación, instalación eléctrica, andenes de carga, piso, HVAC, protección contra incendio y requerimientos especiales), marcando cuáles se encontraron en el RFP, con qué valor/unidad y en qué archivo, además de capturar especificaciones adicionales no contempladas en el checklist. Los resultados se guardan en Supabase, organizados por proyecto y cliente, con historial consultable y filtrable.

## Actores del sistema (4)

### Analista de propuestas

Usuario interno que registra el proyecto y cliente, carga los archivos del RFP, ejecuta el análisis, revisa las especificaciones detectadas y consulta los resultados para preparar una propuesta.

### Administrador de especificaciones

Usuario interno responsable de mantener el checklist de requisitos de construcción, sus categorías, unidades y criterios de evaluación utilizados por el sistema.

### Motor de extracción y evaluación con IA

Componente del sistema que extrae texto de los archivos, identifica valores y unidades, relaciona la información con el checklist interno y detecta especificaciones adicionales.

### Arquitecto

Elabora planos arquitectonicos, fachadas y planta general del proyecto

## Historias de usuario (37)

### Consultar especificaciones arquitectónicas extraídas

- **Rol:** Arquitecto
- **Prioridad:** Alta
- **Formato:** Como **Arquitecto**, quiero **consultar las especificaciones del RFP relacionadas con áreas construidas, alturas, distribución, fachadas y planta general** para **pueda utilizarlas como insumo para elaborar los planos del proyecto**.

**Criterios de aceptación:**

- El sistema muestra los campos arquitectónicos identificados, sus valores y unidades, indicando el archivo de origen y si cada dato fue encontrado o está pendiente.

### Revisar la fuente de cada requisito arquitectónico

- **Rol:** Arquitecto
- **Prioridad:** Alta
- **Formato:** Como **Arquitecto**, quiero **acceder al fragmento del documento donde se identificó cada especificación arquitectónica** para **pueda validar el contexto y evitar interpretar incorrectamente los requerimientos del cliente**.

**Criterios de aceptación:**

- Cada especificación encontrada permite consultar el nombre del archivo y la referencia de página, hoja o sección cuando esté disponible, junto con el texto de contexto extraído.

### Identificar requisitos arquitectónicos faltantes

- **Rol:** Arquitecto
- **Prioridad:** Alta
- **Formato:** Como **Arquitecto**, quiero **visualizar los datos arquitectónicos que no fueron definidos en el RFP** para **pueda solicitar aclaraciones antes de avanzar con los planos y la propuesta de diseño**.

**Criterios de aceptación:**

- El sistema separa los campos encontrados de los faltantes y permite filtrar la vista para mostrar únicamente los requisitos arquitectónicos pendientes.

### Revisar especificaciones adicionales del cliente

- **Rol:** Arquitecto
- **Prioridad:** Media
- **Formato:** Como **Arquitecto**, quiero **consultar los requerimientos arquitectónicos adicionales detectados fuera del checklist interno** para **pueda incorporarlos en la planta general, las fachadas y la documentación del proyecto**.

**Criterios de aceptación:**

- Los requisitos no contemplados en el checklist se muestran con su descripción, valor o condición cuando exista, y archivo de origen.

### Comparar requisitos arquitectónicos entre versiones del RFP

- **Rol:** Arquitecto
- **Prioridad:** Media
- **Formato:** Como **Arquitecto**, quiero **consultar el historial de especificaciones arquitectónicas de un proyecto** para **pueda identificar cambios del cliente que afecten los planos y el diseño**.

**Criterios de aceptación:**

- El historial permite seleccionar versiones o cargas anteriores del RFP y visualizar cambios en valores, unidades, estado de definición y requisitos adicionales.

### Exportar un resumen de requisitos para diseño arquitectónico

- **Rol:** Arquitecto
- **Prioridad:** Media
- **Formato:** Como **Arquitecto**, quiero **descargar un resumen de las especificaciones arquitectónicas encontradas, faltantes y adicionales** para **pueda usarlo como referencia durante la elaboración de planos y coordinar aclaraciones con el equipo**.

**Criterios de aceptación:**

- El sistema genera un archivo descargable con el nombre del proyecto, cliente, fecha, requisitos identificados, valores, unidades, fuentes y campos pendientes.

### Registrar proyecto y cliente

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **crear un registro con el nombre del proyecto y del cliente** para **pueda organizar y consultar el análisis del RFP posteriormente**.

**Criterios de aceptación:**

- El sistema solicita proyecto y cliente como datos obligatorios, valida que no estén vacíos y confirma la creación del registro.

### Cargar archivos del RFP

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **subir uno o varios archivos del RFP en formatos PDF, Word o Excel** para **pueda analizar toda la documentación proporcionada por el cliente**.

**Criterios de aceptación:**

- El sistema permite seleccionar múltiples archivos, valida los formatos admitidos, muestra el nombre y estado de cada archivo y rechaza archivos incompatibles o dañados con un mensaje claro.

### Revisar archivos cargados

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **consultar la lista de archivos asociados a un proyecto antes de iniciar el análisis** para **pueda verificar que la documentación necesaria esté completa y correcta**.

**Criterios de aceptación:**

- La lista muestra nombre, tipo, tamaño, fecha de carga y estado de cada archivo, e incluye una opción para eliminar un archivo antes de ejecutar el análisis.

### Ejecutar análisis del RFP

- **Rol:** Analista de propuestas
- **Prioridad:** Crítica
- **Formato:** Como **Analista de propuestas**, quiero **iniciar el análisis de los archivos cargados** para **pueda obtener automáticamente las especificaciones técnicas identificadas en el RFP**.

**Criterios de aceptación:**

- El sistema permite iniciar el análisis únicamente cuando existe al menos un archivo válido, muestra el estado del procesamiento y notifica si finaliza correctamente o si ocurre un error.

### Consultar especificaciones detectadas

- **Rol:** Analista de propuestas
- **Prioridad:** Crítica
- **Formato:** Como **Analista de propuestas**, quiero **ver el resultado del análisis organizado por especificación del checklist** para **pueda identificar rápidamente los datos técnicos definidos por el cliente**.

**Criterios de aceptación:**

- Cada especificación muestra su nombre, estado de detección, valor identificado, unidad y archivo de origen cuando estén disponibles.

### Consultar la evidencia de una especificación

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **ver el fragmento o referencia del documento que respalda cada especificación detectada** para **pueda validar la información antes de incorporarla a la propuesta**.

**Criterios de aceptación:**

- Para las especificaciones detectadas, el sistema muestra la referencia al archivo y la evidencia textual disponible; si no existe evidencia suficiente, lo indica explícitamente.

### Identificar especificaciones faltantes

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **filtrar las especificaciones del checklist que no fueron encontradas en el RFP** para **pueda preparar preguntas de aclaración y detectar riesgos de información incompleta**.

**Criterios de aceptación:**

- El resultado permite filtrar por encontradas, no encontradas y con información ambigua, manteniendo visibles el nombre y estado de cada especificación.

### Revisar especificaciones adicionales

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **consultar los requisitos técnicos detectados que no pertenecen al checklist interno** para **pueda considerar condiciones especiales del cliente al preparar la propuesta**.

**Criterios de aceptación:**

- El sistema presenta las especificaciones adicionales en una sección separada con su descripción, valor o unidad cuando existan y archivo de origen.

### Consultar el historial de análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Media
- **Formato:** Como **Analista de propuestas**, quiero **buscar y filtrar proyectos y análisis anteriores** para **pueda reutilizar información de propuestas previas y dar seguimiento a los RFP procesados**.

**Criterios de aceptación:**

- El historial permite filtrar por nombre de proyecto, cliente y fecha, y abrir el detalle de un análisis previamente guardado.

### Revisar el estado del análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Alta
- **Formato:** Como **Analista de propuestas**, quiero **ver si un análisis está pendiente, en proceso, completado o fallido** para **pueda saber cuándo los resultados están disponibles y actuar ante errores**.

**Criterios de aceptación:**

- El sistema muestra el estado actualizado del análisis y, cuando falla, proporciona un mensaje descriptivo y una opción para reintentarlo sin perder los archivos cargados.

### Registrar observaciones del análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Media
- **Formato:** Como **Analista de propuestas**, quiero **agregar observaciones internas a las especificaciones detectadas o faltantes** para **pueda documentar aclaraciones y pendientes relevantes para la preparación de la propuesta**.

**Criterios de aceptación:**

- El usuario puede agregar, editar y guardar una observación asociada a un proyecto y especificación, y la observación permanece visible al consultar el análisis.

### Crear especificaciones del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder crear una especificación indicando su nombre, descripción, categoría, unidad de medida y estado** para **el sistema pueda evaluar de forma estructurada los requisitos técnicos de los RFP**.

**Criterios de aceptación:**

- El formulario solicita los campos obligatorios; no permite nombres duplicados dentro de la misma categoría; la especificación creada queda disponible para nuevas evaluaciones.

### Editar especificaciones existentes

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder modificar los datos de una especificación del checklist** para **pueda mantener actualizados los requisitos conforme cambien las necesidades de Lintel**.

**Criterios de aceptación:**

- Puedo editar nombre, descripción, categoría, unidad y criterios de evaluación; el sistema valida los campos obligatorios; los cambios quedan registrados y se aplican a futuras evaluaciones sin alterar resultados históricos.

### Organizar especificaciones por categorías

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder crear, editar, ordenar y desactivar categorías de requisitos** para **el checklist sea fácil de administrar y consultar por áreas técnicas de construcción**.

**Criterios de aceptación:**

- Puedo gestionar categorías como áreas, estructura, iluminación, electricidad, HVAC y protección contra incendio; puedo definir su orden de visualización; una categoría con especificaciones asociadas no se elimina físicamente, sino que se desactiva.

### Configurar unidades de medida

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media
- **Formato:** Como **Administrador de especificaciones**, quiero **poder definir las unidades de medida válidas para cada especificación** para **los valores extraídos de los RFP se interpreten y presenten de manera consistente**.

**Criterios de aceptación:**

- Puedo asignar una unidad principal y, cuando corresponda, unidades alternativas; el sistema muestra la unidad configurada al evaluar y presentar resultados; no se permiten unidades vacías cuando la especificación requiere medición.

### Definir criterios de evaluación para la IA

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder configurar instrucciones, sinónimos y ejemplos de valores esperados para cada requisito** para **la evaluación identifique con mayor precisión la información relevante en distintos formatos de RFP**.

**Criterios de aceptación:**

- Cada especificación permite registrar criterios de búsqueda y reglas de interpretación; los criterios se guardan como parte de la configuración vigente; el sistema utiliza la versión activa en nuevas evaluaciones.

### Activar o desactivar especificaciones

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder activar o desactivar requisitos del checklist sin eliminarlos** para **pueda adaptar temporalmente la evaluación a las necesidades actuales y conservar la configuración histórica**.

**Criterios de aceptación:**

- Las especificaciones inactivas no se incluyen en nuevas evaluaciones; las especificaciones activas sí se incluyen; una especificación desactivada conserva sus datos y puede reactivarse posteriormente.

### Consultar y filtrar el checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media
- **Formato:** Como **Administrador de especificaciones**, quiero **poder consultar el listado de especificaciones filtrando por categoría, estado y tipo de dato** para **pueda revisar rápidamente la cobertura y consistencia del cuestionario interno**.

**Criterios de aceptación:**

- El listado muestra nombre, categoría, unidad, estado y fecha de actualización; permite filtrar por los criterios indicados y buscar por texto; los resultados se pueden ordenar por nombre, categoría o estado.

### Validar la configuración del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Alta
- **Formato:** Como **Administrador de especificaciones**, quiero **poder ejecutar una validación de integridad del checklist** para **pueda detectar configuraciones incompletas antes de que se utilicen en una evaluación de RFP**.

**Criterios de aceptación:**

- La validación identifica especificaciones sin categoría, unidad requerida, criterios de evaluación o nombre; muestra los errores agrupados y permite acceder a la configuración que debe corregirse; el sistema informa cuando el checklist está listo para usarse.

### Consultar el historial de cambios del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media
- **Formato:** Como **Administrador de especificaciones**, quiero **poder consultar quién modificó cada especificación y qué cambios realizó** para **pueda garantizar trazabilidad sobre la evolución de los requisitos utilizados por el sistema**.

**Criterios de aceptación:**

- El historial registra creación, edición, activación, desactivación y cambios de orden; cada evento incluye usuario, fecha, especificación afectada y valores anteriores y nuevos cuando corresponda.

### Duplicar una especificación configurada

- **Rol:** Administrador de especificaciones
- **Prioridad:** Baja
- **Formato:** Como **Administrador de especificaciones**, quiero **poder duplicar una especificación existente como punto de partida para crear otra relacionada** para **pueda ampliar el checklist rápidamente sin volver a capturar toda la configuración**.

**Criterios de aceptación:**

- La duplicación copia categoría, unidad y criterios de evaluación, pero exige asignar un nombre único antes de guardar; la nueva especificación queda independiente de la original y puede editarse sin afectar la fuente.

### Extraer texto de archivos RFP

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Crítica
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **procesar archivos PDF, Word y Excel cargados en un proyecto y extraer su contenido textual** para **pueda analizar automáticamente la información técnica del RFP sin revisión manual inicial**.

**Criterios de aceptación:**

- El sistema procesa los formatos soportados, conserva la relación entre cada fragmento extraído y su archivo de origen, y reporta los archivos que no puedan procesarse.

### Evaluar especificaciones del checklist

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Crítica
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **comparar el contenido extraído contra cada campo del checklist interno de especificaciones** para **pueda determinar qué requisitos están definidos y cuáles faltan en el RFP**.

**Criterios de aceptación:**

- Cada campo del checklist recibe un estado identificable, como encontrado, no encontrado o ambiguo, sin omitir campos aunque no exista información relacionada.

### Identificar valores y unidades técnicas

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **extraer el valor numérico o textual y su unidad para cada especificación encontrada** para **los resultados sean utilizables para preparar y revisar la propuesta**.

**Criterios de aceptación:**

- El resultado conserva el valor original, normaliza la unidad cuando sea posible y marca como ambiguos los datos con unidades ausentes, contradictorias o no reconocidas.

### Vincular especificaciones con su fuente

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **relacionar cada resultado con el archivo y la ubicación aproximada donde fue encontrado** para **el analista pueda verificar rápidamente la información contra el RFP original**.

**Criterios de aceptación:**

- Cada especificación encontrada incluye el nombre del archivo de origen y una referencia disponible, como página, hoja, sección o fragmento de texto.

### Detectar información técnica adicional

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **identificar requisitos técnicos del RFP que no correspondan a los campos actuales del checklist** para **Lintel pueda considerar información relevante que el cuestionario interno aún no contempla**.

**Criterios de aceptación:**

- Las especificaciones adicionales se devuelven separadas de los campos del checklist, con descripción, valor cuando exista y referencia al archivo de origen.

### Gestionar información ambigua o contradictoria

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **marcar los datos ambiguos, incompletos o contradictorios encontrados en uno o varios archivos** para **los usuarios puedan revisarlos antes de confiar en los resultados de la extracción**.

**Criterios de aceptación:**

- El resultado identifica el campo afectado, muestra las interpretaciones o valores detectados, conserva sus fuentes y evita presentar una conclusión definitiva cuando la evidencia sea insuficiente.

### Consolidar resultados de múltiples archivos

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **combinar la información relevante de todos los archivos asociados a un mismo RFP** para **el análisis represente el conjunto completo de documentos entregados por el cliente**.

**Criterios de aceptación:**

- El sistema analiza cada archivo, consolida resultados por especificación, conserva todas las fuentes relevantes y señala conflictos entre documentos.

### Guardar el resultado del análisis

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Crítica
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **almacenar los resultados estructurados del análisis junto con el proyecto y cliente correspondientes** para **el historial pueda consultarse posteriormente sin volver a procesar los archivos**.

**Criterios de aceptación:**

- Se guardan los estados, valores, unidades, fuentes, especificaciones adicionales, advertencias y fecha del análisis asociados al proyecto correcto.

### Informar errores y estado del procesamiento

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Alta
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **registrar el progreso, los errores y el resultado de cada etapa del procesamiento** para **el sistema pueda informar si el análisis terminó correctamente o requiere intervención**.

**Criterios de aceptación:**

- El proceso diferencia estados como pendiente, procesando, completado y fallido; los errores incluyen una descripción útil y no impiden conservar los resultados válidos de otros archivos.

### Aplicar controles básicos de calidad a la extracción

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media
- **Formato:** Como **Motor de extracción y evaluación con IA**, quiero **validar que los resultados extraídos tengan una estructura consistente antes de guardarlos** para **se reduzcan datos incompletos, formatos inválidos y asociaciones incorrectas con el checklist**.

**Criterios de aceptación:**

- El sistema valida la presencia del identificador del campo, estado, valor cuando corresponda y fuente; los resultados que no cumplan la estructura quedan marcados para revisión o son rechazados.

## Casos de uso (27)

### Crear registro de proyecto

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir registrar un proyecto junto con los datos de su cliente para asociar los archivos y análisis correspondientes.

**Pasos:**

1. El analista selecciona la opción para crear un proyecto.
2. El sistema solicita el nombre del proyecto y del cliente.
3. El analista ingresa los datos requeridos.
4. El sistema valida la información.
5. El sistema crea el registro y muestra la confirmación.

### Gestionar archivos del RFP

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir cargar y revisar los archivos del RFP asociados a un proyecto antes de iniciar el análisis.

**Pasos:**

1. El analista selecciona un proyecto existente.
2. El sistema muestra los archivos asociados al proyecto.
3. El analista selecciona uno o varios archivos en formato PDF, Word o Excel.
4. El sistema valida el formato y la carga de cada archivo.
5. El sistema asocia los archivos válidos al proyecto.
6. El sistema actualiza y muestra la lista de archivos cargados.

### Ejecutar análisis del RFP

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir iniciar el análisis de los archivos cargados y consultar el estado de procesamiento del análisis.

**Pasos:**

1. El analista selecciona un proyecto con archivos cargados.
2. El sistema verifica que existan archivos compatibles para analizar.
3. El analista solicita iniciar el análisis.
4. El sistema crea el análisis y lo marca como pendiente o en proceso.
5. El sistema procesa los archivos y compara su contenido con el checklist interno.
6. El sistema actualiza el estado a completado o fallido.
7. El sistema muestra al analista el estado vigente y, cuando corresponde, el resultado del análisis.

### Consultar resultados del análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir revisar las especificaciones detectadas, su evidencia, las especificaciones faltantes y los requisitos técnicos adicionales encontrados en el RFP.

**Pasos:**

1. El analista selecciona un análisis completado.
2. El sistema muestra las especificaciones organizadas según el checklist interno.
3. El analista consulta una especificación detectada.
4. El sistema muestra el fragmento o referencia documental que respalda la detección.
5. El analista aplica el filtro de especificaciones faltantes.
6. El sistema muestra las especificaciones del checklist que no fueron encontradas.
7. El analista consulta las especificaciones adicionales.
8. El sistema muestra los requisitos técnicos detectados que no pertenecen al checklist interno.

### Registrar observaciones del análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir documentar comentarios internos asociados a especificaciones detectadas o faltantes para apoyar la revisión y preparación de la propuesta.

**Pasos:**

1. El analista abre el detalle de un análisis.
2. El analista selecciona una especificación detectada o faltante.
3. El analista ingresa una observación interna.
4. El sistema valida y guarda la observación asociada a la especificación.
5. El sistema muestra la observación junto con el elemento correspondiente.

### Consultar historial de análisis

- **Rol:** Analista de propuestas
- **Prioridad:** Media

Permitir buscar y filtrar proyectos y análisis anteriores para recuperar sus estados y resultados.

**Pasos:**

1. El analista accede al historial de análisis.
2. El sistema muestra los proyectos y análisis registrados.
3. El analista ingresa criterios de búsqueda o selecciona filtros.
4. El sistema filtra los resultados según los criterios indicados.
5. El analista selecciona un proyecto o análisis del historial.
6. El sistema muestra su información, estado y resultados disponibles.

### Crear especificación del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir registrar una nueva especificación del checklist con sus datos descriptivos, categoría, unidad de medida y estado.

**Pasos:**

1. El administrador solicita crear una especificación.
2. El sistema muestra el formulario de alta.
3. El administrador ingresa el nombre, descripción, categoría, unidad de medida y estado.
4. El administrador confirma el registro.
5. El sistema valida los datos obligatorios y las referencias configuradas.
6. El sistema crea la especificación y confirma el resultado.

### Editar especificación del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir modificar los datos configurables de una especificación existente del checklist.

**Pasos:**

1. El administrador consulta y selecciona una especificación existente.
2. El sistema muestra sus datos actuales.
3. El administrador modifica los campos requeridos.
4. El administrador confirma los cambios.
5. El sistema valida la información actualizada.
6. El sistema guarda los cambios y registra la modificación.

### Gestionar categorías de requisitos

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir crear, editar, ordenar y desactivar las categorías utilizadas para organizar los requisitos del checklist.

**Pasos:**

1. El administrador accede a la gestión de categorías.
2. El sistema muestra las categorías existentes y sus posiciones.
3. El administrador crea una categoría nueva, edita sus datos, cambia su orden o solicita desactivarla.
4. El sistema solicita los datos necesarios según la operación seleccionada.
5. El administrador confirma la operación.
6. El sistema valida que la operación no genere inconsistencias.
7. El sistema aplica el cambio y actualiza la organización de las categorías.

### Configurar unidades de medida

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir definir las unidades de medida válidas que pueden utilizarse en cada especificación del checklist.

**Pasos:**

1. El administrador selecciona una especificación.
2. El sistema muestra las unidades de medida actualmente configuradas.
3. El administrador agrega, modifica o quita unidades válidas.
4. El administrador confirma la configuración.
5. El sistema valida las unidades y su compatibilidad con la especificación.
6. El sistema guarda la configuración actualizada.

### Definir criterios de evaluación de especificación

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir configurar las instrucciones, sinónimos y ejemplos que orientan a la IA en la identificación y evaluación de valores de un requisito.

**Pasos:**

1. El administrador selecciona una especificación.
2. El sistema muestra sus criterios de evaluación actuales.
3. El administrador ingresa o modifica las instrucciones, sinónimos y ejemplos de valores esperados.
4. El administrador confirma la configuración.
5. El sistema valida que los criterios estén completos y asociados a la especificación correcta.
6. El sistema guarda los criterios de evaluación.

### Cambiar estado de especificación

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir activar o desactivar una especificación del checklist sin eliminarla ni perder su configuración.

**Pasos:**

1. El administrador selecciona una especificación.
2. El sistema muestra su estado actual.
3. El administrador solicita activar o desactivar la especificación.
4. El sistema informa las implicaciones de la operación, si corresponde.
5. El administrador confirma el cambio.
6. El sistema actualiza el estado y registra la modificación.

### Consultar checklist filtrado

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir consultar el listado de especificaciones aplicando filtros por categoría, estado y tipo de dato.

**Pasos:**

1. El administrador accede al listado del checklist.
2. El sistema muestra las especificaciones disponibles y los filtros.
3. El administrador selecciona uno o más filtros de categoría, estado y tipo de dato.
4. El sistema aplica los filtros solicitados.
5. El sistema muestra las especificaciones coincidentes con sus datos relevantes.
6. El administrador puede ajustar o limpiar los filtros para realizar otra consulta.

### Validar integridad del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir ejecutar una validación de integridad para detectar configuraciones incompletas, inconsistentes o inválidas en el checklist.

**Pasos:**

1. El administrador solicita validar la configuración del checklist.
2. El sistema revisa especificaciones, categorías, estados, tipos de dato, unidades y criterios configurados.
3. El sistema identifica errores, advertencias y elementos afectados.
4. El sistema muestra el resultado detallado de la validación.
5. El administrador consulta los elementos que requieren corrección.

### Consultar historial de cambios del checklist

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir consultar el registro de modificaciones realizadas sobre las especificaciones, incluyendo el usuario responsable y el detalle de los cambios.

**Pasos:**

1. El administrador selecciona una especificación o solicita el historial general.
2. El sistema recupera los eventos de modificación registrados.
3. El sistema muestra quién realizó cada cambio, cuándo se realizó y qué datos fueron modificados.
4. El administrador aplica filtros o selecciona un evento para consultar su detalle.
5. El sistema presenta la información completa del evento seleccionado.

### Duplicar especificación configurada

- **Rol:** Administrador de especificaciones
- **Prioridad:** Media

Permitir crear una nueva especificación reutilizando la configuración de una especificación existente como punto de partida.

**Pasos:**

1. El administrador selecciona una especificación configurada.
2. El administrador solicita duplicarla.
3. El sistema crea un formulario con los datos y criterios copiados de la especificación original.
4. El administrador ajusta el nombre, descripción y cualquier otro dato necesario.
5. El administrador confirma la creación de la copia.
6. El sistema valida que la nueva especificación sea identificable y guarda el registro como una especificación independiente.

### Consultar requisitos arquitectónicos extraídos

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto consultar las especificaciones arquitectónicas identificadas en el RFP y organizadas según el cuestionario interno de Lintel.

**Pasos:**

1. El arquitecto selecciona un proyecto y una versión del RFP.
2. El sistema muestra las especificaciones arquitectónicas extraídas, agrupadas por categoría.
3. El arquitecto filtra o busca requisitos por categoría, estado o término.
4. El sistema actualiza los resultados y muestra el valor identificado para cada requisito.

### Consultar evidencia de requisitos arquitectónicos

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto verificar el fragmento del RFP que sustenta cada especificación arquitectónica extraída.

**Pasos:**

1. El arquitecto selecciona una especificación arquitectónica.
2. El sistema muestra el fragmento del documento asociado al requisito.
3. El sistema identifica la página, sección o ubicación de origen cuando está disponible.
4. El arquitecto revisa la evidencia y regresa al listado de requisitos.

### Identificar requisitos arquitectónicos faltantes

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto detectar qué datos del cuestionario interno de especificaciones arquitectónicas no fueron definidos en el RFP.

**Pasos:**

1. El arquitecto abre el análisis arquitectónico de un proyecto.
2. El sistema compara los requisitos del cuestionario interno con la información extraída del RFP.
3. El sistema muestra los requisitos arquitectónicos sin valor definido.
4. El arquitecto revisa la lista de datos faltantes para considerar su aclaración o estimación en el diseño.

### Consultar requisitos arquitectónicos adicionales

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto revisar requerimientos arquitectónicos detectados en el RFP que no forman parte del checklist interno de Lintel.

**Pasos:**

1. El arquitecto selecciona la sección de requisitos adicionales.
2. El sistema muestra los requerimientos arquitectónicos identificados fuera del checklist interno.
3. El arquitecto consulta el contenido, la categoría propuesta y la fuente de cada requerimiento.
4. El sistema permite acceder al fragmento del RFP asociado al requerimiento adicional.

### Comparar requisitos arquitectónicos entre versiones

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto consultar la evolución de las especificaciones arquitectónicas de un proyecto a través de las distintas versiones del RFP.

**Pasos:**

1. El arquitecto selecciona un proyecto y al menos dos versiones del RFP.
2. El sistema compara las especificaciones arquitectónicas extraídas de las versiones seleccionadas.
3. El sistema muestra requisitos nuevos, modificados, eliminados y sin cambios.
4. El arquitecto consulta el detalle y la fuente de cada diferencia identificada.

### Exportar resumen de requisitos arquitectónicos

- **Rol:** Arquitecto
- **Prioridad:** Media

Permitir al arquitecto descargar un resumen utilizable para el diseño arquitectónico con las especificaciones encontradas, faltantes y adicionales del RFP.

**Pasos:**

1. El arquitecto selecciona un proyecto y una versión del RFP.
2. El sistema prepara el resumen de requisitos encontrados, faltantes y adicionales.
3. El arquitecto selecciona el formato de exportación disponible.
4. El sistema genera y descarga el archivo con el resumen arquitectónico.

### Procesar documentos RFP

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media

Extraer el contenido textual de los archivos RFP asociados a un proyecto y comunicar el estado de cada etapa del procesamiento.

**Pasos:**

1. El motor recibe los archivos PDF, Word y Excel asociados al proyecto.
2. El sistema identifica el tipo y las características de cada archivo.
3. El sistema extrae el contenido textual y la estructura relevante de cada archivo.
4. El sistema registra el progreso de extracción por archivo y por etapa.
5. Si ocurre un error, el sistema lo registra junto con el archivo y la etapa afectada.
6. El sistema entrega el contenido extraído y el estado final del procesamiento.

### Evaluar especificaciones del checklist

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media

Comparar el contenido extraído del RFP con los campos del checklist interno y obtener los valores técnicos junto con sus unidades y fuentes.

**Pasos:**

1. El motor recibe el contenido textual extraído y el checklist interno de especificaciones.
2. El sistema analiza cada campo del checklist contra el contenido disponible.
3. El sistema determina si existe información correspondiente a cada especificación.
4. El sistema extrae el valor numérico o textual y su unidad cuando la especificación está presente.
5. El sistema relaciona cada resultado con el archivo de origen y la ubicación aproximada dentro del documento.
6. El sistema genera los resultados estructurados de evaluación por campo del checklist.

### Consolidar hallazgos técnicos

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media

Integrar la información relevante de todos los archivos del RFP, detectando requisitos adicionales y posibles ambigüedades o contradicciones.

**Pasos:**

1. El motor recibe los resultados de evaluación de todos los archivos asociados al RFP.
2. El sistema agrupa los resultados que corresponden a una misma especificación.
3. El sistema combina los datos coincidentes y conserva sus fuentes de origen.
4. El sistema compara los valores provenientes de distintos archivos para detectar contradicciones.
5. El sistema marca los datos ambiguos, incompletos o contradictorios y registra la evidencia relacionada.
6. El sistema identifica los requisitos técnicos que no corresponden a campos existentes del checklist.
7. El sistema genera un conjunto consolidado de hallazgos técnicos y alertas.

### Validar resultados extraídos

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media

Comprobar que los resultados del análisis mantengan una estructura consistente y contengan la información mínima necesaria antes de almacenarse.

**Pasos:**

1. El motor recibe los resultados extraídos, evaluados y consolidados.
2. El sistema verifica que cada resultado tenga una especificación o categoría identificable.
3. El sistema valida el formato de los valores, las unidades, las fuentes y las ubicaciones.
4. El sistema comprueba la consistencia entre estados, alertas y evidencias asociadas.
5. El sistema marca los resultados incompletos o inválidos y describe las inconsistencias detectadas.
6. El sistema devuelve los resultados aprobados y los errores de calidad para su corrección o revisión.

### Guardar resultado del análisis

- **Rol:** Motor de extracción y evaluación con IA
- **Prioridad:** Media

Almacenar los resultados estructurados y el estado del procesamiento vinculados al proyecto y al cliente correspondientes.

**Pasos:**

1. El motor entrega al sistema los resultados que superaron los controles de calidad.
2. El sistema valida la asociación del análisis con el proyecto y el cliente correctos.
3. El sistema guarda las especificaciones encontradas, ausentes, adicionales y conflictivas.
4. El sistema conserva los valores, unidades, fuentes, ubicaciones y alertas de cada resultado.
5. El sistema guarda el historial de etapas, errores y estado final del procesamiento.
6. El sistema confirma la persistencia del análisis y devuelve su identificador.

## Modelo de datos (31 objetos)

### Proyecto

Contexto comercial y técnico que agrupa los archivos RFP y sus análisis.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del proyecto. |
| name | text | — | Sí | Nombre comercial o referencia del proyecto. |
| clientName | text | — | Sí | Nombre del cliente que envía el RFP. |
| description | textarea | — | — | Descripción general del contexto comercial y técnico. |
| status | text | — | Sí | Estado actual del proyecto. |
| createdAt | datetime | — | Sí | Fecha y hora de creación del registro. |

### Archivo RFP

Archivo proporcionado por el cliente que contiene información del requerimiento de propuesta.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del archivo RFP. |
| proyectoId | uuid | — | Sí | Identificador del proyecto al que pertenece el archivo. |
| fileName | text | — | Sí | Nombre original del archivo proporcionado por el cliente. |
| fileType | text | — | Sí | Tipo o formato del archivo. |
| fileUrl | url | — | Sí | Ubicación del archivo almacenado. |
| processingStatus | text | — | Sí | Estado del procesamiento del archivo. |
| uploadedAt | datetime | — | Sí | Fecha y hora de carga del archivo. |

### Análisis RFP

Ejecución de procesamiento y evaluación de uno o varios archivos RFP contra el checklist.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la ejecución del análisis. |
| proyectoId | uuid | — | Sí | Identificador del proyecto analizado. |
| status | text | — | Sí | Estado de la ejecución del análisis. |
| startedAt | datetime | — | Sí | Fecha y hora de inicio del análisis. |
| completedAt | datetime | — | — | Fecha y hora de finalización del análisis. |
| summary | textarea | — | — | Resumen consolidado de los hallazgos técnicos. |
| findings | textarea | — | — | Detalle de especificaciones identificadas, faltantes y observaciones. |

### Especificación del checklist

Requisito configurable del cuestionario interno utilizado para evaluar el contenido del RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la especificación. |
| name | text | — | Sí | Nombre del requisito técnico que debe evaluarse en el RFP. |
| description | textarea | — | — | Descripción detallada del requisito y de la información esperada. |
| categoryId | uuid | — | Sí | Categoría funcional o técnica a la que pertenece la especificación. |
| unitId | uuid | — | — | Unidad de medida esperada para interpretar el valor técnico extraído. |
| extractionKey | text | — | Sí | Clave utilizada por el motor de extracción para identificar este requisito en el contenido del RFP. |
| isActive | boolean | — | Sí | Indica si la especificación está habilitada para evaluación. |

### Categoría de requisito

Clasificación utilizada para organizar las especificaciones del checklist por áreas funcionales o técnicas.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la categoría. |
| name | text | — | Sí | Nombre de la categoría de requisitos. |
| description | textarea | — | — | Descripción del área funcional o técnica que agrupa la categoría. |
| displayOrder | number | — | Sí | Orden utilizado para mostrar la categoría en el checklist. |
| isActive | boolean | — | Sí | Indica si la categoría está disponible para organizar y filtrar especificaciones. |

### Unidad de medida

Referencia normalizada para interpretar y comparar valores técnicos extraídos de los RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la unidad de medida. |
| name | text | — | Sí | Nombre normalizado de la unidad de medida. |
| symbol | text | — | Sí | Símbolo utilizado para representar la unidad en los valores técnicos. |
| measurementType | text | — | Sí | Tipo de magnitud medida, como longitud, área, volumen, peso o temperatura. |
| conversionFactor | decimal | — | — | Factor utilizado para convertir valores a la unidad normalizada de comparación. |
| isActive | boolean | — | Sí | Indica si la unidad puede utilizarse en nuevas especificaciones y evaluaciones. |

### Criterio de evaluación

Regla que define cómo debe interpretarse y validarse una especificación durante la evaluación automatizada.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del criterio de evaluación. |
| nombre | text | — | Sí | Nombre descriptivo del criterio. |
| descripcion | textarea | — | Sí | Regla y contexto para interpretar y validar una especificación. |
| tipoValidacion | text | — | Sí | Tipo de validación que debe aplicar el motor de evaluación. |
| instruccionesIa | textarea | — | — | Instrucciones específicas para la evaluación automatizada con IA. |
| activo | boolean | — | Sí | Indica si el criterio está habilitado. |

### Requisito arquitectónico extraído

Requisito técnico identificado en el contenido del RFP y asociado con una especificación evaluada.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del requisito extraído. |
| criterioEvaluacionId | uuid | — | — | Identificador del criterio utilizado para evaluar el requisito. |
| especificacion | text | — | Sí | Especificación técnica identificada en el RFP. |
| valorExtraido | text | — | Sí | Valor o contenido detectado para la especificación. |
| estado | text | — | Sí | Estado del requisito, como definido, faltante, adicional o ambiguo. |
| confianzaExtraccion | decimal | — | — | Nivel de confianza asignado por el motor de extracción. |
| observaciones | textarea | — | — | Comentarios o hallazgos asociados al requisito. |

### Evidencia de requisito

Fragmento o referencia del archivo RFP que respalda un requisito extraído.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la evidencia. |
| requisitoArquitectonicoId | uuid | — | Sí | Identificador del requisito arquitectónico respaldado. |
| fragmentoTexto | textarea | — | Sí | Fragmento del RFP que sirve como evidencia. |
| ubicacionFuente | text | — | — | Referencia a página, sección o ubicación dentro del archivo fuente. |
| tipoFuente | text | — | — | Tipo de fuente de la evidencia, como texto, tabla o anexo. |
| relevancia | decimal | — | — | Nivel de relevancia de la evidencia para el requisito. |

### Observación del análisis

Comentario registrado por un usuario sobre un resultado, ambigüedad, contradicción o hallazgo del análisis.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la observación. |
| hallazgoTecnicoId | uuid | — | Sí | Identificador del hallazgo técnico relacionado. |
| usuarioId | uuid | — | Sí | Identificador del usuario que registra la observación. |
| comentario | textarea | — | Sí | Comentario sobre el resultado, ambigüedad, contradicción o hallazgo. |
| tipo | text | — | Sí | Clasificación de la observación, como aclaración, contradicción o validación. |
| createdAt | datetime | — | Sí | Fecha y hora de registro de la observación. |

### Hallazgo técnico

Resultado consolidado que representa información definida, faltante, adicional, ambigua o contradictoria detectada en el RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del hallazgo técnico. |
| especificacionClave | text | — | Sí | Clave o nombre de la especificación evaluada. |
| estado | text | — | Sí | Estado del hallazgo, como definido, faltante, adicional, ambiguo o contradictorio. |
| valorExtraido | textarea | — | — | Valor técnico extraído del RFP. |
| evidencia | textarea | — | — | Fragmento o referencia textual que respalda el hallazgo. |
| confianza | decimal | — | — | Nivel de confianza asignado por el motor de extracción y evaluación. |
| validado | boolean | — | Sí | Indica si el hallazgo fue validado por un usuario. |

### Historial de cambio del checklist

Registro de las modificaciones realizadas sobre la configuración del checklist y sus especificaciones.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del registro histórico. |
| especificacionClave | text | — | Sí | Clave o nombre de la especificación modificada. |
| tipoCambio | text | — | Sí | Tipo de modificación realizada sobre la especificación. |
| valorAnterior | textarea | — | — | Configuración o valor anterior al cambio. |
| valorNuevo | textarea | — | — | Configuración o valor posterior al cambio. |
| usuarioId | uuid | — | Sí | Identificador del usuario que realizó el cambio. |
| changedAt | datetime | — | Sí | Fecha y hora en que se realizó el cambio. |

### Versión del RFP

Edición identificable de los documentos del RFP utilizada para comparar cambios en los requisitos arquitectónicos.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la versión del RFP. |
| versionLabel | text | — | Sí | Nombre o número identificador de la edición del RFP. |
| documentName | text | — | Sí | Nombre del documento principal del RFP. |
| documentUrl | url | — | — | Ubicación del documento original del RFP. |
| uploadedAt | datetime | — | Sí | Fecha y hora de carga de la versión. |
| isCurrent | boolean | — | Sí | Indica si esta es la versión vigente del RFP. |

### Resumen de requisitos arquitectónicos

Síntesis exportable de los requisitos arquitectónicos detectados, faltantes y adicionales del análisis.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del resumen. |
| summaryContent | textarea | — | Sí | Síntesis de los requisitos arquitectónicos detectados, faltantes y adicionales. |
| detectedRequirementsCount | number | — | Sí | Cantidad de requisitos arquitectónicos identificados en el RFP. |
| missingRequirementsCount | number | — | Sí | Cantidad de requisitos internos que no fueron encontrados en el RFP. |
| additionalRequirementsCount | number | — | Sí | Cantidad de requisitos adicionales detectados fuera del cuestionario interno. |
| exportFormat | text | — | — | Formato utilizado para exportar el resumen. |
| generatedAt | datetime | — | Sí | Fecha y hora de generación del resumen. |

### Estado de procesamiento

Situación registrada de cada etapa de carga, extracción, evaluación y consolidación del análisis.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del estado de procesamiento. |
| stage | text | — | Sí | Etapa actual del procesamiento, como carga, extracción, evaluación o consolidación. |
| status | text | — | Sí | Estado de la etapa, como pendiente, en progreso, completada o fallida. |
| progressPercentage | number | — | Sí | Porcentaje estimado de avance de la etapa. |
| errorMessage | textarea | — | — | Detalle del error ocurrido durante el procesamiento, si aplica. |
| startedAt | datetime | — | — | Fecha y hora de inicio de la etapa. |
| completedAt | datetime | — | — | Fecha y hora de finalización de la etapa. |

### Cliente

Parte que solicita o proporciona el RFP asociado a un proyecto.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del cliente. |
| nombre | text | — | Sí | Nombre legal o comercial del cliente. |
| contactoNombre | text | — | — | Nombre de la persona de contacto del cliente. |
| contactoEmail | email | — | — | Correo electrónico principal del contacto. |
| contactoTelefono | phone | — | — | Teléfono principal del contacto. |
| createdAt | datetime | — | Sí | Fecha y hora de registro del cliente. |

### Texto extraído

Contenido textual obtenido de los archivos RFP durante el procesamiento documental.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del texto extraído. |
| clienteId | uuid | — | Sí | Identificador del cliente asociado al RFP. |
| nombreArchivo | text | — | Sí | Nombre del archivo RFP del que se obtuvo el texto. |
| contenido | textarea | — | Sí | Contenido textual extraído del documento. |
| tipoDocumento | text | — | — | Tipo de documento procesado, por ejemplo RFP, anexo o adenda. |
| fechaProcesamiento | datetime | — | Sí | Fecha y hora en que se procesó el documento. |

### Valor técnico extraído

Dato técnico identificado en el contenido del RFP junto con su unidad o representación interpretada.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del valor técnico extraído. |
| textoExtraidoId | uuid | — | Sí | Identificador del texto de origen donde se detectó el valor. |
| especificacion | text | — | Sí | Nombre de la especificación técnica identificada. |
| valor | text | — | Sí | Valor técnico detectado en el RFP. |
| unidad | text | — | — | Unidad de medida asociada al valor técnico. |
| ubicacionTexto | text | — | — | Referencia a la sección, página o fragmento donde se encontró el valor. |
| confianza | decimal | — | — | Nivel de confianza asignado por el motor de extracción. |

### Requisito arquitectónico faltante

Requisito arquitectónico esperado por el checklist que no fue identificado en el RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del requisito faltante. |
| nombre | text | — | Sí | Nombre del requisito arquitectónico esperado por el checklist. |
| descripcion | textarea | — | — | Detalle del requisito que no fue identificado en el RFP. |
| categoria | text | — | — | Categoría técnica o arquitectónica del requisito. |
| prioridad | text | — | — | Nivel de prioridad para revisar o completar el requisito. |
| confianzaDeteccion | decimal | — | — | Nivel de confianza del motor en la identificación del faltante. |

### Requisito arquitectónico adicional

Requisito técnico arquitectónico presente en el RFP que no está contemplado originalmente en el checklist.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del requisito adicional. |
| nombre | text | — | Sí | Nombre del requisito técnico detectado en el RFP. |
| descripcion | textarea | — | — | Contenido o detalle del requisito no contemplado en el checklist. |
| categoria | text | — | — | Categoría técnica o arquitectónica del requisito adicional. |
| referenciaRfp | text | — | — | Página, sección o referencia del RFP donde fue encontrado. |
| confianzaExtraccion | decimal | — | — | Nivel de confianza del motor en la extracción del requisito. |

### Resultado de evaluación

Conclusión producida al comparar una especificación del checklist con la información extraída del RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del resultado de evaluación. |
| especificacionChecklist | text | — | Sí | Especificación del checklist evaluada. |
| valorExtraido | textarea | — | — | Información correspondiente extraída del RFP. |
| estadoEvaluacion | text | — | Sí | Resultado de la comparación, como definido, faltante, parcial o ambiguo. |
| justificacion | textarea | — | — | Explicación de la conclusión producida por la evaluación. |
| confianzaEvaluacion | decimal | — | — | Nivel de confianza del motor en el resultado de evaluación. |
| requiereValidacion | boolean | — | Sí | Indica si el resultado debe ser revisado por un usuario. |

### Incidencia de procesamiento

Error, advertencia o situación ambigua detectada durante la extracción, evaluación o consolidación del RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la incidencia. |
| tipo | text | — | Sí | Tipo de incidencia: error, advertencia o ambigüedad. |
| descripcion | textarea | — | Sí | Detalle de la situación detectada durante el procesamiento. |
| severidad | text | — | Sí | Nivel de impacto de la incidencia. |
| estado | text | — | Sí | Estado de seguimiento de la incidencia. |
| fechaDeteccion | datetime | — | Sí | Fecha y hora en que se detectó la incidencia. |
| detalleTecnico | textarea | — | — | Información técnica adicional para diagnóstico o resolución. |

### Control de calidad de extracción

Verificación aplicada para comprobar la integridad y consistencia de los resultados extraídos.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del control de calidad. |
| nombre | text | — | Sí | Nombre del control aplicado a los resultados extraídos. |
| tipoControl | text | — | Sí | Categoría de verificación realizada. |
| resultado | text | — | Sí | Resultado del control, como aprobado, rechazado o con observaciones. |
| detalleResultado | textarea | — | — | Explicación de los hallazgos del control. |
| fechaEjecucion | datetime | — | Sí | Fecha y hora de ejecución de la verificación. |
| esAutomatico | boolean | — | Sí | Indica si el control fue ejecutado automáticamente. |

### Estado de especificación

Situación operativa de una especificación del checklist dentro de su ciclo de configuración y uso.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del estado. |
| nombre | text | — | Sí | Nombre del estado operativo de la especificación. |
| descripcion | textarea | — | — | Descripción del significado y uso del estado. |
| esActivo | boolean | — | Sí | Indica si el estado está habilitado para su uso. |
| orden | number | — | Sí | Orden de presentación o progresión del estado. |
| fechaCreacion | datetime | — | Sí | Fecha y hora de creación del estado. |

### Configuración del checklist

Conjunto versionable de especificaciones, categorías, unidades y criterios que define cómo se estructura y evalúa el checklist.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la configuración del checklist. |
| name | text | — | Sí | Nombre de la configuración. |
| description | textarea | — | — | Descripción funcional de la configuración. |
| status | text | — | Sí | Estado de la configuración, por ejemplo activa, inactiva o archivada. |
| createdBy | uuid | — | Sí | Identificador del usuario que creó la configuración. |
| createdAt | datetime | — | Sí | Fecha y hora de creación. |
| updatedAt | datetime | — | Sí | Fecha y hora de la última actualización. |

### Versión del checklist

Instantánea identificable de la configuración del checklist utilizada en un momento determinado para preservar su evolución y trazabilidad.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la versión del checklist. |
| checklistConfigurationId | uuid | — | Sí | Identificador de la configuración de checklist a la que pertenece. |
| versionNumber | number | — | Sí | Número secuencial de la versión. |
| status | text | — | Sí | Estado de la versión, por ejemplo borrador, publicada o archivada. |
| changeSummary | textarea | — | — | Resumen de los cambios incluidos en la versión. |
| createdBy | uuid | — | Sí | Identificador del usuario que creó la versión. |
| createdAt | datetime | — | Sí | Fecha y hora de creación de la versión. |

### Estado del análisis

Situación funcional del análisis RFP durante su ciclo de revisión, validación y cierre.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del estado del análisis. |
| code | text | — | Sí | Código interno del estado. |
| name | text | — | Sí | Nombre legible del estado. |
| description | textarea | — | — | Descripción del significado y uso del estado. |
| isFinal | boolean | — | Sí | Indica si el estado representa una etapa final del análisis. |
| displayOrder | number | — | Sí | Orden de presentación del estado en el ciclo del análisis. |

### Requisito técnico adicional

Requisito técnico detectado en el RFP que no corresponde directamente con una especificación configurada del checklist.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del requisito técnico adicional. |
| analysisId | uuid | — | Sí | Identificador del análisis en el que se detectó el requisito. |
| description | textarea | — | Sí | Descripción del requisito técnico detectado en el RFP. |
| sourceReference | text | — | — | Referencia al archivo, página o sección de origen. |
| confidence | decimal | — | — | Nivel de confianza de la extracción automática. |
| status | text | — | Sí | Estado de revisión del requisito, por ejemplo pendiente, validado o descartado. |
| reviewNotes | textarea | — | — | Observaciones registradas durante la revisión. |

### Incidencia de consistencia

Situación de ambigüedad, contradicción o falta de coherencia detectada al interpretar y consolidar información técnica del RFP.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la incidencia. |
| analysisId | uuid | — | Sí | Identificador del análisis donde se detectó la incidencia. |
| description | textarea | — | Sí | Descripción de la ambigüedad, contradicción o falta de coherencia. |
| severity | text | — | Sí | Nivel de severidad de la incidencia. |
| sourceReference | text | — | — | Referencia al archivo, página o sección relacionada. |
| status | text | — | Sí | Estado de la incidencia, por ejemplo abierta, revisada o resuelta. |
| resolutionNotes | textarea | — | — | Notas sobre la resolución o decisión tomada. |

### Consolidación de resultados

Resultado integrado de la evaluación de múltiples archivos o versiones de un RFP dentro de un análisis.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la consolidación. |
| analysisId | uuid | — | Sí | Identificador del análisis al que pertenece el resultado consolidado. |
| summary | textarea | — | Sí | Resumen integrado de los hallazgos técnicos. |
| sourceFileCount | number | — | Sí | Cantidad de archivos o versiones consideradas. |
| versionLabel | text | — | — | Etiqueta de la versión o consolidación. |
| status | text | — | Sí | Estado del resultado consolidado. |
| consolidatedAt | datetime | — | Sí | Fecha y hora en que se consolidaron los resultados. |

### Exportación de requisitos

Entrega generada con una selección estructurada de requisitos arquitectónicos y sus conclusiones para uso externo o de diseño.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la exportación. |
| nombre | text | — | Sí | Nombre descriptivo de la exportación de requisitos. |
| formato | text | — | Sí | Formato de salida de la exportación, como PDF, DOCX o XLSX. |
| contenido | textarea | — | Sí | Selección estructurada de requisitos arquitectónicos y sus conclusiones. |
| urlArchivo | url | — | — | Ubicación del archivo exportado para descarga o uso externo. |
| fechaGeneracion | datetime | — | Sí | Fecha y hora en que se generó la exportación. |

### Relaciones

- **Configuración del checklist** → **Versión del checklist** (one-to-many): contiene versiones
- **Versión del checklist** → **Consolidación de resultados** (one-to-many): se utiliza en consolidaciones
- **Estado del análisis** → **Consolidación de resultados** (one-to-many): clasifica consolidaciones
- **Consolidación de resultados** → **Requisito técnico adicional** (one-to-many): integra requisitos adicionales
- **Consolidación de resultados** → **Incidencia de consistencia** (one-to-many): registra incidencias
- **Consolidación de resultados** → **Exportación de requisitos** (one-to-many): origina exportaciones

## Épicas (5)

### Analista de propuestas

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Analista de propuestas.

**Tickets (9):** Implementar filtros de especificaciones faltantes y adicionales; Implementar consulta de archivos asociados al proyecto; Implementar carga de archivos del RFP; Implementar registro de proyecto y cliente; Implementar inicio del análisis del RFP; Implementar registro de observaciones internas; Implementar estados del análisis del RFP; Implementar consulta de especificaciones detectadas y evidencia; Implementar búsqueda y filtros del historial de análisis

### Administrador de especificaciones

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Administrador de especificaciones.

**Tickets (19):** Backend: Gestionar categorías de requisitos; Backend: Cambiar estado de especificación; Implementar: Configurar unidades de medida; Implementar: Activar o desactivar especificaciones; Backend: Consultar checklist filtrado; Backend: Consultar historial de cambios del checklist; Backend: Definir criterios de evaluación de especificación; Implementar: Validar la configuración del checklist; Backend: Validar integridad del checklist; Backend: Crear especificación del checklist; Backend: Configurar unidades de medida; Backend: Editar especificación del checklist; Implementar: Definir criterios de evaluación para la IA; Implementar: Consultar y filtrar el checklist; Implementar: Organizar especificaciones por categorías; Implementar: Consultar el historial de cambios del checklist; Implementar: Duplicar una especificación configurada; Implementar: Editar especificaciones existentes; Backend: Duplicar especificación configurada

### Motor de extracción y evaluación con IA

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Motor de extracción y evaluación con IA.

**Tickets (10):** Implementar consolidación de resultados de múltiples archivos; Implementar extracción de valores y unidades técnicas; Implementar extracción de texto y estructura de archivos RFP; Implementar marcado de ambigüedades, datos incompletos y contradicciones; Implementar persistencia del resultado estructurado del análisis; Implementar validación estructural de resultados extraídos; Implementar seguimiento de progreso y errores del procesamiento; Implementar detección de requisitos técnicos adicionales; Implementar evaluación de campos contra el checklist interno; Implementar trazabilidad de evidencia por archivo y ubicación

### Arquitecto

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Arquitecto.

**Tickets (6):** Implementar comparación del checklist arquitectónico contra la extracción; Implementar detalle de ubicación de evidencia arquitectónica; Implementar consulta de especificaciones arquitectónicas por versión y categoría; Implementar exportación del resumen arquitectónico del RFP; Implementar comparación de requisitos arquitectónicos entre versiones; Implementar detalle de requisitos arquitectónicos adicionales

### Cliente

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Cliente.

## Backlog de tickets (44)

### Analista de propuestas

- **[Backlog]** Implementar filtros de especificaciones faltantes y adicionales _(task, Media)_
  - Rol: Analista de propuestas · HU: Identificar especificaciones faltantes
  - Implementación: QA
- **[Backlog]** Implementar consulta de archivos asociados al proyecto _(task, Media)_
  - Rol: Analista de propuestas · HU: Revisar archivos cargados
  - Implementación: QA
- **[Backlog]** Implementar carga de archivos del RFP _(task, Media)_
  - Rol: Analista de propuestas · HU: Cargar archivos del RFP
  - Implementación: QA
- **[Backlog]** Implementar registro de proyecto y cliente _(task, Media)_
  - Rol: Analista de propuestas · HU: Registrar proyecto y cliente
  - Implementación: QA
- **[Backlog]** Implementar inicio del análisis del RFP _(task, Media)_
  - Rol: Analista de propuestas · HU: Ejecutar análisis del RFP
  - Implementación: QA
- **[Backlog]** Implementar registro de observaciones internas _(task, Media)_
  - Rol: Analista de propuestas · HU: Registrar observaciones del análisis
  - Implementación: QA
- **[Backlog]** Implementar estados del análisis del RFP _(task, Media)_
  - Rol: Analista de propuestas · HU: Revisar el estado del análisis
  - Implementación: QA
- **[Backlog]** Implementar consulta de especificaciones detectadas y evidencia _(task, Media)_
  - Rol: Analista de propuestas · HU: Consultar especificaciones detectadas
  - Implementación: QA
- **[Backlog]** Implementar búsqueda y filtros del historial de análisis _(task, Media)_
  - Rol: Analista de propuestas · HU: Consultar el historial de análisis
  - Implementación: QA

### Administrador de especificaciones

- **[Backlog]** Backend: Gestionar categorías de requisitos _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Cambiar estado de especificación _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Implementar: Configurar unidades de medida _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Configurar unidades de medida
  - Implementación: Frontend
- **[Backlog]** Implementar: Activar o desactivar especificaciones _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Activar o desactivar especificaciones
  - Implementación: Frontend
- **[Backlog]** Backend: Consultar checklist filtrado _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Consultar historial de cambios del checklist _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Definir criterios de evaluación de especificación _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Implementar: Validar la configuración del checklist _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Validar la configuración del checklist
  - Implementación: Frontend
- **[Backlog]** Backend: Validar integridad del checklist _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Crear especificación del checklist _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Configurar unidades de medida _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Backend: Editar especificación del checklist _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend
- **[Backlog]** Implementar: Definir criterios de evaluación para la IA _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Definir criterios de evaluación para la IA
  - Implementación: Frontend
- **[Backlog]** Implementar: Consultar y filtrar el checklist _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Consultar y filtrar el checklist
  - Implementación: Frontend
- **[Backlog]** Implementar: Organizar especificaciones por categorías _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Organizar especificaciones por categorías
  - Implementación: Frontend
- **[Backlog]** Implementar: Consultar el historial de cambios del checklist _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Consultar el historial de cambios del checklist
  - Implementación: Frontend
- **[Backlog]** Implementar: Duplicar una especificación configurada _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Duplicar una especificación configurada
  - Implementación: Frontend
- **[Backlog]** Implementar: Editar especificaciones existentes _(task, Media)_
  - Rol: Administrador de especificaciones · HU: Editar especificaciones existentes
  - Implementación: Frontend
- **[Backlog]** Backend: Duplicar especificación configurada _(task, Alta)_
  - Rol: Administrador de especificaciones · HU: Crear especificaciones del checklist
  - Implementación: Backend

### Arquitecto

- **[Backlog]** Implementar comparación del checklist arquitectónico contra la extracción _(task, Media)_
  - Rol: Arquitecto · HU: Identificar requisitos arquitectónicos faltantes
  - Implementación: QA
- **[Backlog]** Implementar detalle de ubicación de evidencia arquitectónica _(task, Media)_
  - Rol: Arquitecto · HU: Revisar la fuente de cada requisito arquitectónico
  - Implementación: QA
- **[Backlog]** Implementar consulta de especificaciones arquitectónicas por versión y categoría _(task, Media)_
  - Rol: Arquitecto · HU: Consultar especificaciones arquitectónicas extraídas
  - Implementación: QA
- **[Backlog]** Implementar exportación del resumen arquitectónico del RFP _(task, Media)_
  - Rol: Arquitecto · HU: Exportar un resumen de requisitos para diseño arquitectónico
  - Implementación: QA
- **[Backlog]** Implementar comparación de requisitos arquitectónicos entre versiones _(task, Media)_
  - Rol: Arquitecto · HU: Comparar requisitos arquitectónicos entre versiones del RFP
  - Implementación: QA
- **[Backlog]** Implementar detalle de requisitos arquitectónicos adicionales _(task, Media)_
  - Rol: Arquitecto · HU: Revisar especificaciones adicionales del cliente
  - Implementación: QA

### Motor de extracción y evaluación con IA

- **[Backlog]** Implementar consolidación de resultados de múltiples archivos _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Consolidar resultados de múltiples archivos
  - Implementación: QA
- **[Backlog]** Implementar extracción de valores y unidades técnicas _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Identificar valores y unidades técnicas
  - Implementación: QA
- **[Backlog]** Implementar extracción de texto y estructura de archivos RFP _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Extraer texto de archivos RFP
  - Implementación: QA
- **[Backlog]** Implementar marcado de ambigüedades, datos incompletos y contradicciones _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Gestionar información ambigua o contradictoria
  - Implementación: QA
- **[Backlog]** Implementar persistencia del resultado estructurado del análisis _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Guardar el resultado del análisis
  - Implementación: QA
- **[Backlog]** Implementar validación estructural de resultados extraídos _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Aplicar controles básicos de calidad a la extracción
  - Implementación: QA
- **[Backlog]** Implementar seguimiento de progreso y errores del procesamiento _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Informar errores y estado del procesamiento
  - Implementación: QA
- **[Backlog]** Implementar detección de requisitos técnicos adicionales _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Detectar información técnica adicional
  - Implementación: QA
- **[Backlog]** Implementar evaluación de campos contra el checklist interno _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Evaluar especificaciones del checklist
  - Implementación: QA
- **[Backlog]** Implementar trazabilidad de evidencia por archivo y ubicación _(task, Media)_
  - Rol: Motor de extracción y evaluación con IA · HU: Vincular especificaciones con su fuente
  - Implementación: QA

---

_Fin de la especificación._