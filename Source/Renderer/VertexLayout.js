/*global define*/
define(['../Core/Enumeration'], function(Enumeration) {
    "use strict";

    /**
     * Determines if vertex attributes are interleaved in a single vertex buffer or if each attribute is stored in a separate vertex buffer.
     *
     * @exports VertexLayout
     *
     * @see Context#createVertexArrayFromMesh
     */
    var VertexLayout = {
        /**
         * Each attribute will be stored in a separate vertex buffer.  This can be slightly slower
         * than using a single interleaved vertex buffer, but it is more flexible; more easily allowing
         * the sharing of vertex buffers among vertex arrays.  It also requires much less initial CPU
         * processing than interleaving.
         *
         * @constant
         * @type {Enumeration}
         */
        SEPARATE : new Enumeration(0, 'SEPARATE'),
        /**
         * Each attribute will be interleaved in a single vertex buffer.  This can have a slight
         * performance advantage over using a separate vertex buffer per attribute, but it requires
         * extra CPU processing to initially interleave the vertex data.  This is recommended for
         * static data that will be rendered over several frames.
         *
         * @constant
         * @type {Enumeration}
         */
        INTERLEAVED : new Enumeration(1, 'INTERLEAVED'),

        /**
         * DOC_TBA
         *
         * @param vertexLayout
         *
         * @returns {Boolean}
         */
        validate : function(vertexLayout) {
            return ((vertexLayout === VertexLayout.SEPARATE) ||
                    (vertexLayout === VertexLayout.INTERLEAVED));
        }

    };

    return VertexLayout;
});