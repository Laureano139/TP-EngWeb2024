<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <xsl:output method="xml" indent="yes"/>
    
    <xsl:template match="mapa">
        <xsl:result-document href="lugares.xml">
            <lugares>
                <xsl:for-each select="document(rua/@doc)">
                    <xsl:apply-templates mode="lugares"/>
                </xsl:for-each>
            </lugares>
        </xsl:result-document>
    </xsl:template>
    
    <xsl:template mode="lugares" match="lugar">
        <xsl:copy-of select="."/>
    </xsl:template>
    
    <xsl:template match="lugar" mode="lugares">
        <lugar>
            <nome><xsl:value-of select="upper-case(.)"/></nome>
            <rua><xsl:value-of select="/rua/meta/número"/></rua>
            <posição><xsl:value-of select="generate-id()"/></posição>
        </lugar>
    </xsl:template>
    
    <!-- garbage colector -->
    <xsl:template mode="lugares" match="text()" priority="-1"/>  
  
</xsl:stylesheet>