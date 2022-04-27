import {Injectable} from '@angular/core';
import {Layer} from 'konva/lib/Layer';
import {Image as KonvaImage} from 'konva/lib/shapes/Image';
import {Line} from 'konva/lib/shapes/Line';
import {Text} from 'konva/lib/shapes/Text';
import {Transformer} from 'konva/lib/shapes/Transformer';
import {BehaviorSubject} from 'rxjs';
import {Rect} from 'konva/lib/shapes/Rect';
import {Circle} from 'konva/lib/shapes/Circle';
import {RegularPolygon} from 'konva/lib/shapes/RegularPolygon';
import {jsPDF} from 'jspdf';
import Konva from 'konva';
import {KonvaOptions, KonvaTools, Slide, StageEvents} from '@core/models';
import {Stage} from 'konva/lib/Stage';

@Injectable({
  providedIn: 'root'
})
export class KonvaService {
  private stageChangeSubject = new BehaviorSubject<{ event: StageEvents, [key: string]: any }>(null);
  private selectedTool: KonvaTools = 'select';
  private selectedOptions: KonvaOptions = {
    thickness: 4,
    color: '#000000',
    textSize: 16
  };
  private slides: Slide[] = [];
  private currentSlide: Slide = {
    stage: null,
    layer: null,
    shapes: []
  };

  start(slidesCount: number = 5, initSlide: number = 0) {
    for (let i = 0; i < slidesCount; i++) {
      const konvaWrapper = document.querySelector('.konva-wrapper');
      const containerEl = document.createElement('div');
      const id = this.getId(i);
      containerEl.id = id;
      konvaWrapper.appendChild(containerEl);
      this.init(id);
    }
    this.goToSlide(initSlide);
    this.setTool(this.selectedTool);
  }

  init(selector: string) {
    const initialWidth = 1000;
    const initialHeight = 1000;
    const json =
      '{"attrs":{"width":1396,"height":656},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"width":"auto","height":"auto","text":"Text Shadow!","fontFamily":"Calibri","fontSize":95,"x":20,"y":20,"stroke":"red","shadowColor":"black","shadowBlur":2,"shadowOffsetX":10,"shadowOffsetY":10,"shadowOpacity":0.5,"fill":"black"},"className":"Text"},{"attrs":{"stroke":"green","strokeWidth":10,"lineJoin":"round","lineCap":"round","points":[{"x":50,"y":140},{"x":450,"y":160}],"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5},"className":"Line"},{"attrs":{"x":280,"y":100,"width":100,"height":50,"fill":"#00D2FF","stroke":"black","strokeWidth":4,"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5,"rotation":0.35038503988659,"id":"blueRectangle"},"className":"Rect"},{"attrs":{"x":100,"y":41,"width":106,"height":118,"id":"yodaImage"},"className":"Image"}]},{"attrs":{},"className":"Layer","children":[{"attrs":{"stroke":"#000000","strokeWidth":4,"points":[216,191,216,191,221,195,226,198,236,203,243,206,253,211,266,216,280,222,299,227,327,235,357,245,392,255,431,267,475,280,522,292,576,307,629,320,680,329,730,338,784,349,827,352,867,356,897,358,927,358,954,358,976,358,992,358,1005,358,1018,357,1031,356,1043,355,1054,354,1065,353,1076,351,1087,349,1096,346,1106,343,1114,339,1119,336,1127,331,1131,328,1135,323,1138,319,1142,312,1144,308,1146,304,1148,298,1149,294,1149,289,1150,283,1150,278,1150,272,1150,267,1150,258,1150,252,1149,244,1146,239,1145,232,1142,225,1139,220,1136,212,1133,208,1128,202,1122,198,1117,193,1111,190,1101,184,1096,182,1085,179,1078,178,1068,178,1056,178,1046,178,1034,178,1021,179,1007,181,990,184,972,191,946,202,923,210,896,221,873,230,845,242,824,251,802,260,779,272,760,282,741,291,722,301,708,310,693,319,676,329,664,339,651,347,636,356,624,364,611,372,599,380,589,385,581,390,576,393,570,397,568,398,565,400,565,401,563,403,562,403,562,403,561,404],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"stroke":"#000000","strokeWidth":4,"points":[605,214,605,214,612,219,616,224,620,230,624,235,626,242,629,247,632,254,634,261,635,266,636,270,637,273,640,278,640,280,640,280,640,280,640,281,641,282],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"text":"awfawfawfawfawf","x":259,"y":374,"fill":"#000000","fontSize":16,"width":200},"className":"Text"},{"attrs":{"enabledAnchors":["middle-left","middle-right"],"ignoreStroke":true,"padding":5,"name":"transformer","visible":false},"className":"Transformer"},{"attrs":{"x":398,"y":103,"width":300,"height":225},"className":"Image"},{"attrs":{"ignoreStroke":true,"padding":5,"name":"transformer","visible":false},"className":"Transformer"}]},{"attrs":{},"className":"Layer","children":[{"attrs":{"stroke":"#000000","strokeWidth":4,"points":[511,232,511,232,512,232,514,234,523,237,533,240,545,243,557,247,571,248,592,249,612,249,629,249,652,248,675,246,695,242,717,236,735,230,748,224,758,219,764,216,768,210,771,206,772,202,772,198,771,192,770,187,766,180,762,174,757,169,752,165,744,160,733,155,722,152,704,151,684,151,658,151,629,152,597,157,569,163,537,171,509,182,488,192,464,202,450,210,437,221,430,229,425,235,421,242,418,248,417,256,417,266,417,273,417,286,418,295,420,309,422,323,424,336,424,347,425,360,425,368,425,377,422,382,420,388,418,390,414,394,409,398,405,399,400,401,393,402,387,402,377,400,367,397,354,390,335,379,308,363,288,351,264,334,243,319,226,307,213,295,203,287,198,279,194,271,192,264,191,256,191,248,191,240,192,230,194,223,197,215,202,208,206,200,213,192,219,186,224,180,234,176,240,171,248,167,258,162,268,157,280,152,292,150,306,147,320,144,336,142,352,139,375,138,393,137,411,136,429,134,448,132,466,131,485,128,501,126,517,124,531,122,542,120],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"stroke":"#000000","strokeWidth":4,"points":[392,283,392,283,392,283,392,286,393,289,393,291,394,294,394,296,395,298,396,300,396,302,397,303,397,306,397,307,398,309,398,311,398,312,398,315,399,316,399,318,399,319,399,320,399,322,399,323,400,325,400,326,400,327,400,328,400,331,400,331,400,333,400,334,400,336,400,338,400,340,400,341,400,343,400,345,400,347,401,350,401,350,401,352,402,355,402,355,402,358,402,359,403,361,404,362,404,364,405,366,405,368,406,370,407,372,408,374,409,376,410,380,411,382,412,384,413,386,414,388,415,390,416,392,418,395,420,397,421,398,423,400,425,403,427,406,429,408,432,411,434,413,434,414,438,418,442,421,445,424,450,427,454,432,461,435,465,439,469,441,472,443,477,446,481,448,485,451,488,451,489,452,494,456,496,457,497,457,498,458],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"stroke":"#000000","strokeWidth":4,"points":[1316,136,1316,136],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"stroke":"#000000","strokeWidth":14,"points":[650,110,650,110,654,112,656,115,662,118,664,120,669,124,673,128,677,130,688,137,694,141,698,144,704,147,708,150,714,152,719,155,724,158,728,160,733,162,736,164,738,166,743,167,744,168,746,169,749,170,749,171,752,172,752,172,754,173,755,174,757,174,760,176,766,179,770,181,772,182,777,183,782,185,786,186,792,189,798,190,807,192,821,197,826,200,835,201,842,202,847,205,853,206,861,208,869,209,877,211,888,214,898,215,907,219,920,222,931,226,944,229,955,232,967,236,978,237,989,239,1000,240,1010,240,1021,243,1032,243,1041,244,1048,244,1056,244,1063,245,1068,245,1070,245,1074,244,1076,243,1079,242,1081,240,1082,238,1085,236,1089,232,1092,229,1094,224,1096,222,1097,219,1098,217,1100,215,1100,214,1100,213,1100,212,1100,211,1100,208,1100,207,1100,206,1099,205,1099,204,1098,204,1097,203,1097,203,1095,202,1093,202,1093,202,1092,202,1091,202,1090,202,1089,201,1088,201,1085,200,1085,200,1083,200,1082,200,1081,200,1080,200,1077,200,1077,200,1074,200,1073,200,1069,201,1066,201,1064,202,1062,202,1059,203,1057,203,1056,203,1053,204,1047,206,1039,208,1037,208,1033,210,1029,211,1022,213,1016,214,1010,216,1002,218,994,221,986,222,978,224,970,227,960,230,933,238,921,241,910,244,898,248,887,249,876,251,866,254,855,257,844,259,832,262,821,266,810,269,798,272,786,275,775,277,764,280,753,283,742,285,730,288,721,290,712,291,701,294,691,296,682,298,675,299,665,302,658,304,653,305,645,307,639,308,636,310,629,310,626,311,621,313,616,314,613,315,606,316,602,317,597,319,591,320,585,321,579,323,573,325,568,327,562,328,558,329,552,331,549,332,545,334,538,336,532,336,527,337,518,339,512,340,504,341,496,342,488,343,480,344,472,344,468,344,460,346,453,346,448,347,442,347,437,347,433,347,426,347,421,348,414,348,407,348,403,348,398,349,392,349,387,349,381,350,377,350,371,350,365,350,357,350,353,350,346,350,339,351,333,351,326,351,320,351,312,351,305,351,300,351,291,351,286,350,281,349,277,348,273,347,267,346,264,344,260,343,253,341,250,339,243,337,239,336,234,333,229,330,223,328,218,325,213,320,209,318,205,315,200,312],"lineCap":"round","lineJoin":"round"},"className":"Line"},{"attrs":{"stroke":"#000000","strokeWidth":1,"points":[129,278,129,278,130,280,131,285,133,286,133,288,135,292,136,296,138,301,139,304,141,307,142,312,144,318,145,322,146,326,147,331,148,337,149,342,150,347,152,353,154,359,155,365,158,376,159,381,161,386,162,390,165,399,166,404,169,409,171,416,173,421,174,427,176,432,178,437,181,441,182,445,185,451,193,467,196,473,202,481,205,488,211,494,216,500,223,506,229,512,235,517,242,521,248,526,254,529,269,539,278,543,283,547,293,550,301,554,310,558,320,562,861,563,872,560,882,558,895,555,906,552,916,550,925,545,937,541,946,537,957,531,984,513,992,507,1000,501,1006,495,1010,491,1014,487,1023,473,1026,467,1029,462,1032,456,1033,451,1034,442,1034,437,1034,426,1034,419,1034,408,1032,398,1016,358,994,315,989,307,977,288,958,263,934,239,926,231,917,224,908,216,895,209,880,200,864,195,848,187,830,179,773,158,760,154,746,150,733,147,720,145,709,144,698,143,687,142,676,142,665,142,653,142,642,142,629,142,616,142,602,144,584,146,570,148,555,150,542,156,527,160,514,166,502,171,473,184,463,190,443,205,437,209,429,217,423,222,416,229,410,235,405,240,399,247,394,253,389,257,386,262,382,266,379,270,378,275,376,278,373,284,373,288,372,296,372,299,372,302,372,307,373,311,375,315,378,319,378,322,386,332,390,339,392,342,397,347,402,352,408,358,414,363,421,369,429,375,451,390,459,394,467,398,474,401,485,406,493,409,504,414,512,417,525,420,535,424,547,427,558,429,570,432,584,435,600,437,614,439,629,443,643,445,656,446,667,448,680,450,693,451,747,454,760,454,774,454,790,455,839,455,855,454,872,454,885,454,898,453,909,451,921,450,932,448,939,446,947,443,952,440,957,438,969,424,974,418,978,411,981,404,984,396,986,389,986,379,987,369,987,360,986,341,983,333,976,316,972,310,968,305,966,302,964,300,962,298,960,296,957,294,957,294,954,293,949,290,943,287,936,285,930,283,922,280,914,279,905,277,896,276,885,275,876,275,865,275,824,275,789,276,784,277,779,278,775,280,773,280,771,281,769,283,766,284,764,286,762,288,760,291,757,294,754,298,752,301,748,309,746,313,746,315,746,317,745,319,745,322,745,325,745,327,745,329,745,333,746,336,748,339,749,342,750,344,752,346,753,348,755,350,758,353,759,354,761,357,763,358,765,360,767,360,770,363,771,363,773,364,775,365,776,366,778,366,779,366,780,367,781,367,783,367,784,367,786,367,787,367,789,367,792,367,794,367,795,366,797,366,798,365,800,364,801,364,802,363,802,363,803,362,805,361,805,360,806,360,807,358,808,358,808,356,809,355,809,355,809,354,809,353,809,352,808,352,808,352,807,352,805,352,805,351,805,350,804,350,803,350,802,350,800,349,799,349,798,348,797,347,795,346,794,346,794,346,793,345,792,344,792,344,791,343,790,342,789,341,788,340,786,339,786,337,786,336,785,334,784,333,784,332,784,331,784,331,784,328,784,327,784,326,784,324,784,318,785,318,785,317,786,316,786,315,786,314,786,314,787,312,788,312,788,311,789,310,790,309,792,308,792,307,793,307,794,306,795,306,797,306,797,306,798,306,800,306,800,306,800,307,801,307,802,307,802,308,802,309,803,309,803,310,803,311,803,312,803,313,803,314,803,315,803,317,803,318,803,319,803,320,803,322,802,323,802,324,802,325,802,326,802,326,801,327,800,328,800,329,799,330,798,331,797,331,796,333,795,334,794,334,794,334,793,334,793,335,794,330,794,329,795,328,795,327,797,326,798,325,798,324,799,324,800,323,800,323,802,322,804,322,805,321,808,321,812,321,816,321,818,321,824,322,825,322,827,323,829,323,829,323,830,324,831,324,833,326,834,326,835,326,836,326,837,326,840,328,840,328,841,330,844,330,845,331,845,331,846,331,848,333,853,335,859,338,860,339,861,339,861,339,863,339,864,339,866,339,867,339,868,339,869,339,870,339,872,339,873,339,874,339,876,338,881,332,881,331,882,331,883,330,883,328,883,328,884,327,884,326,884,326,884,324,884,323,884,322,883,320,882,320,882,320,881,318,881,318,880,318,880,318,879,318,877,318,877,318,876,318,875,318,874,320,873,320,872,322,872,323,869,326,867,328,864,331,858,339,856,344,850,355,848,359,845,363,834,379,829,387,825,393,821,401,814,409,810,414,806,422,802,424,797,431,794,435,789,440,786,445,781,449,778,452,776,454,771,459,769,462,767,464,762,469,760,471,760,471,759,472,759,472,761,472,763,471,765,470,766,470,768,469,770,468,770,467,771,467,772,467,773,467,773,467,774,467,775,467,776,467,777,467,778,469,780,470,782,471,785,472,786,472,788,474,790,475,792,476,794,478,797,478,799,480,801,480,801,480,802,480,803,481,804,481,805,481,805,481,806,481,808,481,808,481,810,481,811,480,812,479,814,478,818,472,820,472,821,471,821,470,822,470,822,469,823,467,824,467,824,466,824,462,824,460,824,459,824,459,824,457,824,456,824,455,824,454,824,454,824,454,824,453,823,453,821,453,819,453,815,453,802,451,797,451,789,451,780,451,773,451,765,451,755,451,736,451,693,451,647,451,638,451,627,451,563,453,552,453,544,453,534,453,525,453,517,453,508,453,501,453,496,453,490,453,485,453,482,453,478,453,476,453,474,453,472,453,472,453,471,452,473,453,474,453,476,455,477,456,478,457,480,459,480,459,481,461,483,464,486,467,488,469,491,475,492,475,493,478,493,480,493,480,493,482,495,483,496,484,496,486,496,487,496,488,497,490,498,491,498,492,498,494,498,494,498,495,499,498,500,499,500,499,500,500,500,501,500,502,498,498,493,488,488,478,487,478,486,478,486,477,485,477,485,477,479,477,475,477,473,477,471,477,469,477,466,477,464,477,461,477,460,477,459,477,458,478,458,475,458,472,458,472,458,470,459,468,459,467,460,466,463,464,465,462,466,461,469,459,472,458,474,456,477,455,480,454,482,453,486,451,496,448,503,446,517,445,522,443,529,443,536,442,544,441,552,440,560,438,566,437,584,434,602,427,607,424,622,415,629,411,634,405,640,398,646,391,652,383,656,378,658,371,662,366,665,359,666,354,669,349,669,344,669,338,670,330,670,322,670,315,670,307,670,297,668,290,665,281,662,275,659,268,655,260,651,255,648,248,642,241,636,236,630,229,618,217,610,212,605,208,596,203,589,200,582,198,575,197,570,195,556,195,551,194,547,194,544,194,541,194,540,195,538,195,536,197,533,198,530,200,528,203,522,209,516,217,513,220,512,224,510,226,508,230,506,234,504,244,503,248,503,260,503,266,503,270,503,276,504,283,506,291,512,308,524,327,533,340,538,347,544,351,552,358,559,364,569,371,577,377,588,385,597,390,608,397,621,403,637,410,685,432,701,438,717,446,733,451,788,472,810,480,832,489,850,497,868,504,886,512,902,518,918,525,933,531,971,544,981,548,992,552,1001,556,1011,559,1018,561,1056,561,1064,555,1066,552,1069,547,1073,542,1077,535,1085,510,1087,499,1088,465,1053,321,1048,310,1040,297,1007,259,989,242,970,228,949,219,925,207,898,198,749,163,557,144,434,136,380,134,336,133,296,133,264,133,242,133,229,133,221,134,218,134,216,134,215,136,214,136,214,142,214,149,216,156,218,164,225,194,229,214,251,304,282,387,287,397,291,406,295,413,298,419,301,425,301,426,301,427,301,427,301,428,301,431,301,433,301,434,301,436,301,438,301,439,301,439,301,440,308,440,317,438,336,432,365,422,395,413,440,398,486,388,534,381,586,375,639,374,680,374,776,374,805,374,826,374,837,374,854,374,847,386,807,452,770,513,765,522,762,527,760,533,759,534,759,535,758,535,757,535,755,535,736,535,716,535,645,531,622,531,599,528,585,527,577,526,568,524,568,524,571,515,573,510,578,502,584,494,589,483,595,470,602,452,611,431,618,414,621,394,625,349,624,312,621,298,618,288,613,276,607,268,595,257,549,225,530,216,485,194,478,192,475,190,474,190,474,190,474,189,476,183,478,181,492,171,500,166,514,162,532,157,552,155,578,152,607,149,628,146,653,144,709,144,720,144,729,144,735,144,739,147,741,148,744,149,745,150,746,152,749,159,750,166,752,175,752,187,754,204,754,229,755,252,758,280,762,302,769,324,773,339,778,350,784,357,786,363,787,365,791,368,791,369,793,371,794,371,797,372,797,372,795,366,794,364,793,363,792,363,781,360,763,358,677,356,635,356,594,356,549,356,450,363,418,367,397,369,384,371,368,373,367,374,366,374,365,374,365,373,364,362,362,349,346,304,340,294,333,286,320,275,304,267,280,255,250,246,216,239,183,234,149,230,120,228,96,225,84,225,76,224,72,224,71,224,101,211,129,200,166,189,213,176,260,160,314,143,370,130,428,120,483,117,528,117,616,124,640,133,669,152,674,158,676,165,678,174,678,183,674,225,672,251,668,272,668,295,668,312,670,323,675,332,679,340,685,346,693,352,702,356,733,358,789,352,809,347,876,319,903,303,925,287,941,272,970,235,974,224,974,221,962,195,943,190,909,187,775,184,698,184,615,186,536,190,466,199,408,213,311,254,288,275,282,286,280,297,280,307,286,318,299,332,317,344,348,360,383,372,426,382,469,387,568,396,608,399,640,399,658,400,697,407,701,408,703,410,703,411,702,416,693,428,683,439,624,480,596,493,557,502,517,504,465,504,410,500,352,488,304,472,262,454,231,440,216,430,210,423,206,416,206,409,207,400,217,379,235,347,264,312,399,190,445,163,496,142,552,126,614,120,671,117,728,117,777,117,818,117,898,124,910,127,922,131,930,137,938,147,952,163,960,169,994,196,1007,204,1048,229,1057,235,1080,250,1088,255,1092,260,1093,262,1092,265,1082,276,1064,290,1031,307,991,320,933,328,872,328,798,325,627,285,558,265,499,248,460,235,448,228,445,225,445,224,449,214,464,200,486,181,519,159,557,138,598,118,642,102,754,94,787,98,840,120,848,128,861,158,861,171,863,188,863,208,869,319,924,665,403,658,411,656,430,658,435,702,457,805,456,815,451,816,451],"lineCap":"round","lineJoin":"round"},"className":"Line"}]}]}';

    // this.currentSlide.stage = Konva.Node.create(json, selector);
    this.currentSlide.stage = new Stage({
      container: selector,
      width: initialWidth,
      height: initialHeight
    });
    this.currentSlide.layer = new Layer();
    this.currentSlide.stage.add(this.currentSlide.layer);
    this.slides.push({stage: this.currentSlide.stage, layer: this.currentSlide.layer, shapes: []});

    let shape: any;
    let isPaint: boolean = false;
    let sourcePoints: any;

    this.currentSlide.stage.on('mousedown touchstart', (e) => {
      console.log(this.currentSlide.stage.toJSON());
      const emptySpace = e.target === e.target.getStage();
      if (emptySpace) {
        const shapes = this.currentSlide.stage.find('.transformer');
        shapes.forEach(sh => {
          sh.hide();
        });
      }
      sourcePoints = this.currentSlide.stage.getPointerPosition();
      switch (this.selectedTool) {
        case 'text':
          this.text(sourcePoints);
          break;

        case 'brush':
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'line':
        case 'eraser':
          isPaint = true;
          shape = this[this.selectedTool](sourcePoints);
          break;
      }
    });

    this.currentSlide.stage.on('mousemove touchmove', (e) => {
      if (!isPaint) {
        return;
      }
      const pos = this.currentSlide.stage.getPointerPosition();
      if (this.selectedTool == 'brush' || this.selectedTool == 'eraser') {
        e.evt.preventDefault();
        const newPoints = shape.points().concat([pos.x, pos.y]);
        shape.points(newPoints);
        this.currentSlide.layer.batchDraw();
      }
      if (this.selectedTool == 'line') {
        const points = shape.points().slice();
        points[2] = pos.x;
        points[3] = pos.y;
        shape.points(points);
        this.currentSlide.layer.batchDraw();
      }
      if (this.selectedTool == 'rectangle') {
        shape.width(pos.x - sourcePoints.x);
        shape.height(pos.y - sourcePoints.y);
        this.currentSlide.layer.batchDraw();
      }
      if (this.selectedTool == 'circle') {
        const radius = pos.x - sourcePoints.x;
        shape.radius(Math.abs(radius));
        this.currentSlide.layer.batchDraw();
      }
      if (this.selectedTool == 'triangle') {
        const radius = pos.x - sourcePoints.x;
        shape.radius(Math.abs(radius));
        this.currentSlide.layer.batchDraw();
      }
    });

    this.currentSlide.stage.on('mouseup touchend', () => {
      isPaint = false;
    });

    const fitStageIntoParentContainer = () => {
      const containerElem: any = document.querySelector(`#${this.currentSlide.stage.container().id}`);
      const containerWidth = containerElem.offsetWidth;
      const containerHeight = containerElem.offsetHeight;
      const scaleX = containerWidth / initialWidth;
      const scaleY = containerHeight / initialHeight;
      this.currentSlide.stage.width(1000 * scaleX);
      this.currentSlide.stage.height(1000 * scaleY);
      // this.currentSlide.stage.scale({x: scaleX, y: scaleY});
    };

    setTimeout(() => {
      fitStageIntoParentContainer();
    });
    window.addEventListener('resize', fitStageIntoParentContainer);
  }

  private brush(pos: any) {
    const line = new Line({
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      globalCompositeOperation: 'source-over',
      points: [pos.x, pos.y, pos.x, pos.y],
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0,
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private circle(pos: any) {
    const circle = new Circle({
      x: pos.x,
      y: pos.y,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(circle);
    return circle;
  }

  private triangle(pos: any) {
    const triangle = new RegularPolygon({
      x: pos.x,
      y: pos.y,
      sides: 3,
      radius: 0,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(triangle);
    return triangle;
  }

  private rectangle(pos: any) {
    const rect = new Rect({
      x: pos.x,
      y: pos.y,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(rect);
    return rect;
  }

  private line(pos: any) {
    const line = new Line({
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      listening: false,
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private eraser(pos: any) {
    const line = new Line({
      stroke: '#ffffff',
      strokeWidth: 30,
      globalCompositeOperation: 'destination-out',
      points: [pos.x, pos.y, pos.x, pos.y],
      lineCap: 'round',
      lineJoin: 'round'
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private text(pos: any) {
    const text = new Text({
      text: '',
      x: pos.x,
      y: pos.y,
      fill: this.selectedOptions.color,
      fontSize: this.selectedOptions.textSize,
      draggable: false,
      width: 200,
    });

    const tr = this.addTransformer(text, true, ['middle-left', 'middle-right']);

    const appendTextarea = () => {
      const textPosition = text.absolutePosition();
      const areaPosition = {
        x: this.currentSlide.stage.container().offsetLeft + textPosition.x,
        y: this.currentSlide.stage.container().offsetTop + textPosition.y,
      };
      const textarea = document.createElement('textarea');
      let transform = '';
      text.hide();
      tr.show();
      document.body.appendChild(textarea);
      textarea.style.position = 'absolute';
      textarea.style.border = 'none';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'none';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.transformOrigin = 'left top';
      textarea.value = text.text();
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = text.width() - text.padding() * 2 + 'px';
      textarea.style.height = text.height() - text.padding() * 2 + 5 + 'px';
      textarea.style.fontSize = text.fontSize() + 'px';
      textarea.style.lineHeight = text.lineHeight().toString();
      textarea.style.fontFamily = text.fontFamily();
      textarea.style.textAlign = text.align();
      textarea.style.color = text.fill();
      if (text.rotation()) {
        transform += 'rotateZ(' + text.rotation() + 'deg)';
      }
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isEdge = document.DOCUMENT_NODE || /Edge/.test(navigator.userAgent);
      if (isFirefox) {
        const px = 2 + Math.round(text.fontSize() / 20);
        transform += ' translateY(-' + px + 'px)';
      }
      textarea.style.transform = transform;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 3 + 'px';
      setTimeout(() => {
        textarea.focus();
      }, 0);

      const setTextareaWidth = (newWidth: number) => {
        if (!newWidth) {
          newWidth = (text as any).placeholder.length * text.fontSize();
        }
        if (isSafari || isFirefox) {
          newWidth = Math.ceil(newWidth);
        }
        if (isEdge) {
          newWidth += 1;
        }
        textarea.style.width = newWidth + 'px';
      };

      textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.keyCode === 27) {
          removeTextarea();
        }
        const scale = text.getAbsoluteScale().x;
        text.text(textarea.value);
        setTextareaWidth(text.width() * scale);
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + text.fontSize() + 'px';
        tr.forceUpdate();
      });

      const removeTextarea = () => {
        textarea.parentNode?.removeChild(textarea);
        this.currentSlide.stage.off('click', handleOutsideClick);
        text.show();
        tr.hide();
        tr.forceUpdate();
      };

      const handleOutsideClick = () => {
        text.text(textarea.value);
        removeTextarea();
      };

      this.currentSlide.stage.on('click tap', (e: any) => {
        const emptySpace = e.target === e.target.getStage();
        if (emptySpace) {
          handleOutsideClick();
        }
      });
    };

    appendTextarea();

    text.on('transform', () => {
      text.setAttrs({
        width: text.width() * text.scaleX(),
        scaleX: 1,
      });
    });

    text.on('dblclick dbltap', (e) => {
      if (this.selectedTool != 'select') {
        return;
      }
      appendTextarea();
    });
  }

  image(file: File) {
    const URL = window.webkitURL || window.URL;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const img_width = img.width;
      const img_height = img.height;
      const max = 300;
      const ratio = (img_width > img_height ? (img_width / max) : (img_height / max));
      const image = new KonvaImage({
        image: img,
        x: (this.currentSlide.stage.width() / 2) - (img_width / ratio),
        y: (this.currentSlide.stage.height() / 2) - (img_height / ratio),
        width: img_width / ratio,
        height: img_height / ratio,
        draggable: false,
      });
      this.addTransformer(image, true);
    };
  }

  private addTransformer(shape: any, resetTool: boolean = false, anchors?: string[]) {
    const tr = new Transformer({
      node: shape as any,
      enabledAnchors: anchors,
      // ignore stroke in size calculations
      ignoreStroke: true,
      padding: 5,
      name: 'transformer'
    });

    tr.hide();
    shape.on('mousedown touchstart', (e) => {
      if (this.selectedTool != 'select') {
        shape.draggable(false);
        return;
      }
      tr.show();
      shape.opacity(0.5);
      shape.shadowOpacity(0.5);
      shape.shadowColor('black');
      shape.shadowBlur(10);
      shape.shadowOffset({x: 10, y: 10});
      shape.draggable(true);
    });
    shape.on('mouseup touchend dragend', (e) => {
      shape.opacity(1);
      shape.shadowOpacity(0);
      shape.shadowColor('transparent');
      shape.shadowBlur(0);
      shape.shadowOffset({x: 0, y: 0});
    });
    this.addToLayerAndShapes(shape);
    this.addToLayerAndShapes(tr);
    this.currentSlide.layer.draw();
    if (resetTool) {
      tr.show();
      this.setTool('select');
    }
    return tr;
  }

  private addToLayerAndShapes(item: any) {
    this.currentSlide.shapes.push(item);
    this.currentSlide.layer.add(item);
  }

  private getId(index: number) {
    return `slide${index}`;
  }

  undo() {
    const removed = this.currentSlide.shapes.pop();
    if (!removed) {
      return;
    }
    if (removed instanceof Transformer) {
      removed.detach();
      this.currentSlide.shapes.pop()?.remove();
    } else {
      removed.remove();
    }
    this.currentSlide.layer.draw();
  }

  clearBoard() {
    this.currentSlide.layer.destroyChildren();
    this.currentSlide.layer.draw();
  }

  async saveAsImage() {
    const images = [];
    const doc: any = new jsPDF({orientation: 'landscape'});
    const dirtySlides = this.slides.filter(slide => slide.stage.getLayers()[0].children.length);
    dirtySlides.forEach((slide, i) => {
      const dataUrl = slide.stage.toDataURL();
      images.push(dataUrl);
    });
    const getImageFromUrl = (src) => {
      return new Promise<any>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };
    const generatePdf = async (urls: string[]) => {
      for (const [i, url] of urls.entries()) {
        const image = await getImageFromUrl(url);
        const pageSize = doc.internal.pageSize;
        doc.addImage(image, 'png', 0, 0, pageSize.getWidth(), pageSize.getHeight());
        if (i !== urls.length - 1) {
          doc.addPage();
        }
      }
    };
    await generatePdf(images);
    doc.output('dataurlstring', 'file.pdf');
    doc.output('save', 'file.pdf');
  }

  stageChange() {
    return this.stageChangeSubject.asObservable();
  }

  setTool(tool: KonvaTools) {
    this.selectedTool = tool;
    this.stageChangeSubject.next({event: 'toolChange', tool});
  }

  setOption(option: KonvaOptions) {
    this.selectedOptions = {...this.selectedOptions, ...option};
    this.stageChangeSubject.next({event: 'optionChange', option: this.selectedOptions});
  }

  goToSlide(slideIndex: number) {
    const id = this.getId(slideIndex);
    this.currentSlide = this.slides.find(s => s.stage.container().id == id);
    (document.querySelector(`#${id}`) as any).style.display = 'block';
    document.querySelector('.konva-wrapper').childNodes.forEach((ch: any) => {
      if (ch.id != this.currentSlide.stage.container().id) {
        ch.style.display = 'none';
      }
    });
  }
}
