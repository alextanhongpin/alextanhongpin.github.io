.PHONY: process resize

OUTPUT_WIDTH := 1920
EXTENSION := JPG

install:
	brew install mogrify

# Create a duplicate folder with the suffix -resize
makedir:
		find batch/** -type d -exec mkdir {}-resize \;

# Search only folders with the suffix -resize, and perform image resize to the targetted output-width
resize:
		find batch/** -type d -not -path "*/*-resize" -not -path "." -exec mogrify -path {}-resize -resize ${OUTPUT_WIDTH} {}/*.${EXTENSION}\;

# For each folder with the suffix -resize, extract the metadata of the file to json
# You can exec bash for multiple chain function!
metadata:
		find batch/** -type d -path "*/*-resize" -exec sh -c "convert {}/*.${EXTENSION}[1x1+0+0] json: > {}/data.json" \;

# Process the metadata
process:
		find batch/**/**.json -exec node index.js {} \;

# Batch compress the image, but persist the metadata (can be removed with -strip)
# compress:
# 		find . -type d -exec mogrify -path {}-min -filter Triangle -define filter:support=2 -resize ${OUTPUT_WIDTH} -unsharp 0.25x0.25+8+0.065 -dither None -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off -define png:compression-filter=5 -define png:compression-level=9 -define png:compression-strategy=1 -define png:exclude-chunk=all -interlace none -colorspace sRGB {}/*.jpg \;
compress:
		find batch/** -type d -path "*/*-resize" -exec imageoptim "{}/*.${EXTENSION}" "{}/*.jpeg" \;
		
