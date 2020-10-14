import React from 'react';
import styles from './preview.css';


export function Preview({url, handleClickPreview, id}) {
  return (
    <button className={styles.previewContainerButton} onClick={()=>handleClickPreview(id)}>
      <img className={styles.previewImg}
           src={url}
           alt='previewPic'
      />
    </button>
  );
}
