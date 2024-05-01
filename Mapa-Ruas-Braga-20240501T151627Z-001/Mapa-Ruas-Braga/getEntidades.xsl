<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <xsl:output method="xml" indent="yes"/>
    
    <xsl:template match= "mapa">
        <xsl:result-document href="entidades.xml">
        <entidades>
            <xsl:for-each select="document(rua/@doc)">
                <xsl:apply-templates mode="entidades"/>
             </xsl:for-each>
        </entidades>
        </xsl:result-document>
    </xsl:template>
    
    
    <xsl:template match="entidade" mode="entidades">
        <entidade>
            <tipo><xsl:value-of select="@tipo"/></tipo>
            <nome><xsl:value-of select="upper-case(.)"/></nome>
            <rua><xsl:value-of select="/rua/meta/número"/></rua>
            <posição><xsl:value-of select="generate-id()"/></posição>
            
        </entidade>
    </xsl:template>
   
   <!-- garbage colector--> 
    <xsl:template mode="entidades" match="text()" priority="-1"/>
</xsl:stylesheet>