CREATE PROCEDURE insertReference (link TEXT, tags TEXT, addedBy VARCHAR(200))  
BEGIN  
	INSERT INTO reference(Link, Tags, AddedBy)
	VALUES(link, tags, addedBy);
END//
 

CREATE PROCEDURE getReference (tag VARCHAR(200))  
BEGIN  
	SELECT * 
	FROM reference
	WHERE tags LIKE CONCAT('%', tag, '%')
	ORDER BY RAND( ) 
	LIMIT 1;
END//


CREATE PROCEDURE deleteReference (idToDelete INT)  
BEGIN  
	DELETE FROM reference WHERE Id = idToDelete;
END//



CALL insertReference('http://imgur.com/gallery/nQjZRKc', 'deer, cute', 'artomizer');
CALL getReference('child');
CALL deleteReference(2);

//-----

CREATE PROCEDURE insertLOL (funny TEXT, addedBy VARCHAR(200))  
BEGIN  
	INSERT INTO lol(funny, AddedBy)
	VALUES(funny, addedBy);
END//

CREATE PROCEDURE getLOL (tag VARCHAR(200))  
BEGIN  
	SELECT * 
	FROM lol
	WHERE funny LIKE CONCAT('%', tag, '%')
	ORDER BY RAND( ) 
	LIMIT 1;
END//

CREATE PROCEDURE deleteLOL (idToDelete INT)  
BEGIN  
	DELETE FROM lol WHERE Id = idToDelete;
END//


CALL insertLOL('test', 'artomizer');
CALL getLOL('test');
CALL deleteLOL(1);
